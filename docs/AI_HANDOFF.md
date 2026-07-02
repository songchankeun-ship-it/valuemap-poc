<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-07-02T17:11:51.143Z
Project: OrnScore
Path: C:\Users\dongy\OneDrive\바탕 화면\valuemap-poc

## Operating Agreement

- Treat this file as the shared memory between Codex, Claude, GPT, the home PC, and the work PC.
- Read this file before changing code, and update it before ending a meaningful work session.
- Keep project-specific rules in `CLAUDE.md` and `AGENTS.md` pointed back to this handoff.
- Do not revert user or other-agent changes unless the user explicitly asks.
- Prefer small verified progress, clear next steps, and reproducible checks.

## Cross-PC Workflow

- Home PC runs AI Dev Center as the 24-hour control dashboard.
- Work PC should pull/sync the project, read this handoff, work, then push/sync and update this handoff.
- When switching AI tools because of usage limits, the next AI should continue from this file instead of relying on chat history.

## Last AI Center Event

- Task: 148 - OrnScore watchlist and alert preference local UX pass
- Run: 119
- Status: failed
- Agent: claude
- Note: Quality gate error: tester process exited with code 1

## Next Agent Checklist

1. Inspect the current worktree before assuming prior state is complete.
2. Read any project-specific docs linked from this file.
3. Continue the highest-priority user goal with focused edits.
4. Run the relevant finite checks.
5. Update this handoff with what changed, what passed, and what remains.

## Manual Notes

Add stable human notes below this managed block or in separate docs. The AI Dev Center will update only the managed block between the markers.
<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:END -->

## Manual Notes

### Task 148 (continuation) — 저장 필터↔조건 알림 다리 정합 패스 (2026-07-03, Claude)
- **배경**: 직전 커밋 `e53235a`로 item B/C(카카오 행 카피·인앱 프리뷰)·상단 "내 현황" 알림 CTA는 반영됐으나, AI Center Run 119 tester가 code 1로 종료돼 관리 블록 상태가 `failed`로 남음(개발 게이트는 통과였음). 재감사 결과 **저장한 필터 섹션에 조건 충족 알림으로 가는 경로가 빠져** 무료 기능 경로가 한 곳에서 끊겼다.
- **변경 소스(1)**: `WatchlistClient.tsx` 저장한 필터 푸터에 **저장 필터 → 조건 충족 알림 다리** 1줄 추가 — `/settings/notifications`(조건 충족 알림) 내부 링크 + "지금은 이메일(임시·베타) · 카카오톡 준비 중" 일관 프레이밍. 텍스트만 추가(기존 44px/flex-wrap·`break-words` 안에서 래핑, 레이아웃 무변경). 압박·매수·매도·가격 단정 0.
- **무변경 확인**: `alertPrefs.ts`(localStorage-only·무발송)·`features.ts`·이메일 cron·매직링크·점수식·`stocks.json`·의존성 그대로. 신규 npm 0. 카카오 프리뷰/채널/토글 코드에 fetch·외부 API 0(grep 확인) — 프리뷰 버튼은 내부 `/stock/{ticker}` 이동만.
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `verify_metrics.py`(UTF8) 138/0/금칙0/Metrics 2.4 · `npm run build` 0(138 SSG·라우트 표 무변경) · 변경 소스 U+FFFD 0·스캐폴딩 마커 0 · 톤 게이트 0. 로컬 prod 41499(리스너 PID만 taskkill·AI Center 4310 무중단): `/watchlist`·`/settings/notifications` 200, SSR에 카카오 채널 카피·"카카오톡 알림 미리보기"·"실제 발송된 메시지가 아닙니다"·"조건 충족 알림" 렌더. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만·푸시는 사용자).

### Task 148 — 관심 종목 + 알림 설정 로컬 UX 패스 (무발송 카카오 Stage 1) (2026-07-03, Claude)
- **범위**: 관심 종목↔알림을 하나의 **일관된 무료 기능 경로**로 정리하는 로컬 UX 패스. 제3자 호출 0·계정/민감 설정·비밀값 0. 점수식·`stocks.json`·`features.ts`·인증·이메일 cron·매직링크·의존성 무변경, 신규 npm 0. 불변식 유지. 브랜치 `ai-center/task-148-ornscore-watchlist-and-alert-prefere`(클린 시작).
- **변경 소스(4)**: `WatchlistClient.tsx`(알림 CTA "알림 설정 보기" + "지금 되는 것 vs 준비 중" 1줄), `NotificationChannels.tsx`(카카오 행 보조 카피 1줄·flex-col 재구성·이메일 상태 무변경), `KakaoAlertPreview.tsx`(**신규** — 카카오 말풍선 정적 프리뷰·`AlertExampleData` 재사용·무발송·"실제 발송된 메시지가 아닙니다" 고지·웹링크는 내부 `/stock/{ticker}`), `settings/notifications/page.tsx`(§4-1로 프리뷰 렌더).
- **무발송 유지**: `alertPrefs.ts`는 localStorage-only·백엔드 미연결 그대로(채널맵 확장=실발송 결정과 함께 잔여, 백로그 Stage 1 item A). 카카오톡 실발송·발신프로필·템플릿 심사·대행사·건당 과금은 오너 게이트(백로그 §4).
- **추적**: `ornscore-kakaotalk-alert-backlog.md` §1·§3 Stage 1(item B/C ✅ 로컬 완료·item A 잔여), `ornscore-spec-coverage.md` §7 Task 148 포인터, PROGRESS 본 항목.
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `verify_metrics.py`(UTF8) 138/0/금칙0/Metrics 2.4 · `build` 0(138 SSG·라우트 표 무변경) · 변경/신규 소스 U+FFFD 0·스캐폴딩 마커 0 · 톤 게이트 0(부정 고지만). 로컬 prod 41482(리스너 PID 35552만 taskkill·**AI Center 4310 무중단**): `/watchlist`·`/settings/notifications` 200, SSR에 카카오 채널 카피·"카카오톡 알림 미리보기"·"실제 발송된 메시지가 아닙니다" 렌더. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

### Task 145 — 모바일 리스팅 준비 팩(로컬 전용) + 메타데이터 갭 감사 (2026-07-03, Claude)
- **범위**: 미래 모바일 스토어 등록을 **검토·준비하기 쉽게** 정리하는 로컬 전용 리뷰 계층. **외부 서비스 액션 0**(제출·업로드·계정/결제/로그인 제공자/원격 설정 무변경). 앱 소스 무변경(문서 전용). 스토어 정식 초안 원본은 `app-store-submission-pack.md` 유지(복사 아닌 링크 참조). 불변식(무료·한국어 전용·138종목·비자문·확정가/Pro 비홍보) 유지.
- **신규 `docs/ornscore-mobile-listing-prep-pack.md`**: §1 현재 표면 감사(앱 이름·태그라인·privacy/terms·mailto·모바일 우선 가치, 각 `file:line` 근거 — `manifest.ts`/`layout.tsx`/`app-store-submission-pack.md`) · §2 정제 한국어 리스팅 카피 **6블록**(짧은 요약·긴 설명·기능 불릿·안전 고지·스크린샷 체크리스트[홈/탐색/상세/공시/비교/관심/소개, 세로 standalone·수익보장 문구 금지·출시 전 스토어 배지 금지]·오너 전용 다음 단계) · §3 PWA/메타데이터 로컬 감사표 · §4 수정 결정 · §5 검증.
- **메타데이터 결정 = 문서화 전용(소스 미변경)**: 코드에 존재하는 필드(manifest id/name/short_name/description/standalone/portrait/shortcuts/4아이콘, layout apple-touch/appleWebApp/viewport/themeColor/openGraph/twitter)는 이미 정합. 남은 갭(OG/Twitter 공유 이미지 에셋·manifest `screenshots[]`·캡처 스크린샷)은 **전부 에셋 선행 필요 → ⑤ 오너/디자인 게이트**로 §3 표에 기록(코드 결함 아님, 자명 안전 무에셋 추가 없음).
- **추적**: `ornscore-spec-coverage.md` §8 H §24 PWA 행에 Task 145 포인터(Task 72/77/128 스타일). 본 파일.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py` 138/0/금칙0/Metrics 2.4 · `app:check` 통과 · 변경 문서 U+FFFD 0·스캐폴딩 마커 0·한국어 정상. 문서 전용이라 모바일/데스크톱 런타임·UI 영향 0(`<head>` 무변경).
- **⚠️ 오너 게이트로 남음(⑤/④)**: 실기기 standalone 스크린샷 7종 캡처·OG/Twitter 공유 카드 이미지 제작·`screenshots[]` 채우기·스토어 등록 최종 다듬기·Data safety/App Privacy 재확인. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

### Task 144 — 카카오톡 알림 로컬 전용 제품 백로그 + 감사 + 이메일-우선 소프트닝 (2026-07-02, Claude)
- **범위**: 오너의 카카오톡 알림 선호를 **외부 계정/민감 설정 무변경**으로 단계 백로그화. 카카오 채널/발신프로필/템플릿/대행사/env/시크릿 배치·제3자 API 호출·유료 약정 **0**. 점수식·`stocks.json`·인증/provider·DB 스키마·라우트·의존성·이메일 cron 무변경, 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지.
- **신규 `docs/ornscore-kakaotalk-alert-backlog.md`**: §0 가드레일 + **카카오 로그인(라이브)≠알림톡(미설정)** 구분 · §1 표면 감사(`file:line`·카카오 준비도) · §2 로컬 지금 vs 오너 전용 · §3 Stage 1~4(채널선호 opt-in UI[`alertPrefs`를 `{type,channel}`로 확장·여전히 localStorage 무발송]·`AlertEvent` 스키마[9종 카탈로그 매핑·dedupeKey·선호 영속화는 설계만]·한국어 비자문 알림톡 템플릿 초안[`#{변수}`+웹링크 버튼]·폴백[카카오→이메일 임시폴백→인앱, 이메일 cron 무변경]) · §4 오너 외부 설정 fill-in 빈칸 시트(값 없음·**건당 과금 단가는 오너 결정으로만**) · §5 검증. 방대 문서는 중복 대신 링크(`free-beta-v1-scope`·`auth-providers-setup`·`beta-launch-checklist`(g)·`android-twa-owner-checklist`).
- **소프트닝(톤만·로직 무변경·ko/en)**: `copy/today.ts`(`watchHint`)·`copy/stocks.ts`(`confirmAlertLogin`·`alertCreated`)·`ConditionAlertsManager.tsx` 조건 알림 설명을 "현재는 이메일 발송, 카카오톡 알림 준비 중" 로드맵 톤으로. `settings/notifications` 배너·`alertCatalog.ts:85`는 이미 정합 → 무변경. 라이브 컨트롤 카드(`page.tsx:144`)는 현재 채널의 정확한 사실 + 상단 배너가 임시/베타로 프레이밍 → 유지(카카오 라이브 오해 소지 없음). `features.ts`·이메일 cron·매직링크·점수식 무변경.
- **추적**: `ornscore-spec-coverage.md` §7·§5.4에 Task 144 포인터. PROGRESS·본 파일.
- **게이트(전부 통과)**: `tsc --noEmit` 0 · `verify_metrics.py` 138/0/금칙0/Metrics 2.4 · `build` 0(라우트 표 무변경) · `/settings/notifications` 200·SSR 한국어·카카오 채널 행 존재 · 변경 소스 U+FFFD 0 · 스캐폴딩 마커 0 · 톤 게이트 0. 모바일/데스크톱: docs 영향 0, 카피는 44px/flex-wrap 내 텍스트만·390px 불변(실 픽셀 육안 운영자 잔여⑤).
- **⚠️ 오너 게이트로 남음**: 카카오 비즈니스 채널·발신프로필·알림톡 템플릿 심사·대행사(Solapi·NHN 등)·API 키 Vercel 배치·**건당 과금 단가**. §4 빈칸 시트를 채워 돌려주면 다음 AI가 `AlertEvent`→대행사 어댑터→폴백 순 발송 코드 착수. 실 키·단가·심사만 외부 게이트. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

### Task 135 — 무료 출시 스모크 + 전환 퍼널 QA (앱 소스 무변경) (2026-07-02, Claude)
- **범위**: 무료 한국어 베타(138종목) 출시 후 집중 QA + **전환 퍼널 각도**(로그인 진입·`next` 복귀·제공자·데이터 신뢰/안전 문구). 앱 코드 무수정. 점수식·`stocks.json`·인증/provider/env·시크릿·DB·라우트·의존성 무변경, 신규 npm 0. 불변식 유지. Task 127(`docs/ornscore-post-release-qa-2026-07-02.md`) 재기재 대신 참조.
- **게이트 전부 통과**: `tsc` 0 · `verify_metrics.py` 138/0/금칙0/Metrics 2.4 · `build` 0(라우트 표 무변경·138 SSG) · `app:check` 통과(1 WAIT=assetlinks 기존 게이트) · 로컬 prod 4456 `perf:check` 11라우트 200·advisory 0. **AI Center 4310(PID 26420) 무중단**, 4456 리스너만 정리.
- **스모크/불변식**: 12 공개 경로 200·치명 마커 0. INV-1..6 전부 유지(138·비자문·EN숨김·AI숨김·무료베타 리드·요금제 내비 강등). 요금제 톤 조건부·비확정.
- **전환 퍼널 정상**: 헤더 로그인 진입 일관, `/watchlist` 비로그인 CTA가 `?next=%2Fwatchlist`로 복귀 보존, `/login` 카카오/구글/네이버/이메일 매직링크 4종. 과대약속·매수매도 권유·"곧 유료" phrasing 0.
- **결과**: 신규 결함 0 → **앱 소스 무변경**(Task 127 동일 결론). 산출물=신규 QA 노트+PROGRESS+본 파일. 잔여(운영자)=실기기 OAuth·데스크톱/390px 시각 게이트(P1)·assetlinks. 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

### Task 128 — OrnScore Android TWA 운영자 인테이크 체크리스트 + assetlinks 생성기 dry-run 가드 (2026-07-02, Claude)
- **범위**: Android TWA Play 등재 **다음 한 걸음에 필요한 실제 값만 운영자가 채우게 하는 짧은 빈칸 시트** 신설 + 오프라인 검증 스크립트 강화. 외부 계정/대시보드/스토어 제출 **0**, 실 서명값·`public/.well-known/assetlinks.json` 생성 **0**. 런타임/UI 소스 **무변경**(docs + 오프라인 검증 스크립트 한정), 신규 npm 0. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지.
- **문서 사실 재확인(현행 유지, 수정 아님)**: 패키지명 `com.ornscore.app`(submission-pack·app-packaging-final-checklist·owner-final-checklist), assetlinks 명령 `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<SHA-256>"` → `scripts/generate-assetlinks.mjs` 매핑, `manifest.ts`(display standalone·start_url/·scope/·lang ko-KR·아이콘 192/512/512-maskable·shortcuts /today /stocks /disclosures), 정책 링크 `/privacy`·`/terms`. 실제 불일치 0건 → 침묵 편집 없음.
- **신규 파일 — `docs/ornscore-android-twa-owner-checklist.md`**: 기존 방대한 문서와 분리된 **fill-in 인테이크 시트**. 6개 항목을 빈칸으로: ①Play Console 계정 준비도(생성/$25 결제 Y/N·개인 vs 조직·인증 상태) ②패키지명 확정(기본 `com.ornscore.app` 확인/변경, 출시 후 사실상 영구 명시) ③서명 SHA-256(앱 서명 키+업로드 키 **둘 다**, Play App Signing 시 앱 서명 키가 assetlinks에 들어감·32 콜론 hex 형식) ④스크린샷(Play 휴대폰 2~8장·최소 320px·16:9/9:16·주소창 없는 standalone/TWA 캡처) ⑤스토어 문구 상태(submission-pack 초안 최종 확정 Y/N) ⑥OAuth 콜백(Kakao/Google/Naver/Supabase가 프로덕션 `https://ornscore.com` 오리진 이미 커버 — TWA는 동일 웹 오리진 재사용이라 신규 콜백 URL 불필요임을 명시 + 실기기 standalone 복귀 §5-1 검증). 나머지 문서는 **중복 대신 링크**(readiness·submission-pack·owner-final-checklist·roadmap §5-1). handoff-back: 운영자가 package id + 실 SHA-256 채워 돌려주면 `npm run app:assetlinks -- --package <id> --fingerprint "<SHA-256>"` → `npm run app:check`.
- **`scripts/check-app-packaging.mjs` 강화(오프라인·네트워크/계정 불필요, 기존 WAIT 동작 유지)**:
  - `generate-assetlinks.mjs` `--dry-run`을 `spawnSync`로 실행 → 유효 형식 더미 지문(32 hex 바이트)에서 exit 0 + 파싱 가능한 JSON(package_name·지문 일치) 단언, 자리표시자 지문(`REPLACE_WITH_REAL_...`)에서 non-zero exit 단언, dry-run/자리표시자 실행이 `public/.well-known/assetlinks.json`을 만들지 않았음 재확인. → 생성기가 오프라인에서 조용히 회귀하지 못함.
  - 신규 `docs/ornscore-android-twa-owner-checklist.md` 존재 + 잠금 패키지명 `com.ornscore.app` + assetlinks 명령 문자열 포함 드리프트 가드 2건 추가.
- **게이트(전부 통과)**: `npm run app:check` → 통과(신규 생성기 3단언·문서 2단언 OK 포함, **여전히 1 WAIT** = `assetlinks.json` 미생성 = 기존 운영자 외부 게이트, 회귀 아님) · `npx tsc --noEmit` → 0 · `npm run build` → Compiled successfully, 176 SSG·`/stock/[ticker]` `●` 138경로 189kB, **라우트 표 무변경**. 런타임/UI 소스 무변경 → 모바일/데스크톱 렌더 영향 0. `public/.well-known/assetlinks.json`은 전 과정에서 **생성된 적 없음**(재확인).
- **⚠️ 운영자 게이트로 남음(코드로 처리 불가)**: assetlinks 실값 생성·스토어 제출·Play Console 계정 결제·서명 키 생성. 운영자가 위 인테이크 시트 ②③(package id + 실 앱 서명 SHA-256)을 채워 돌려주면 다음 AI가 assetlinks 생성 → `app:check` 통과까지 이어감.
- **오너용 요약**: ✅ Android TWA 다음 단계에 필요한 값만 채우는 한 장짜리 운영자 인테이크 시트 추가 + assetlinks 생성기가 오프라인 회귀하지 않도록 검증 스크립트 강화. 실 서명값·스토어 제출·외부 계정 변경 0. push/릴리스 미수행(task 브랜치 로컬 커밋만).

### Task 126 — OrnScore 앱 패키징 준비 (standalone viewport·theme-color·safe-area·iOS appleWebApp) (2026-07-02, Claude)
- **범위**: 무료 한국어 베타(138종목)를 다음 앱 패키징 단계로 넘기기 위한 **로컬 안전 개선만**. 스토어 제출·외부 계정/대시보드 변경 **없음**, 서비스워커·유료 플랜·숨겨진 AI 분석 **미도입**. 점수식·`stocks.json`·인증/provider/env·DB 스키마·라우트 의미·`package.json` 의존성 무변경, 신규 npm **0**. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지.
- **변경 3소스 + 1스크립트 + docs**:
  - `src/app/layout.tsx`: Next 14 **`viewport` export 신규** — `width:device-width, initialScale:1, viewportFit:"cover"`, `themeColor` 라이트/다크 2종(`#ffffff`/`#09090b`). `viewport-fit=cover`로 노치 기기의 `env(safe-area-inset-*)` 활성화. **`maximumScale`/`userScalable:"no"` 미설정**(확대 허용 — 접근성). 기존 `metadata`(icons·openGraph·robots·JSON-LD) 전부 보존한 채 **`appleWebApp` 추가**(`capable:true, statusBarStyle:"black-translucent", title:"오른스코어"`) → iOS 홈 화면 설치 시 상태바·앱 제목 정상.
  - `src/app/layout.tsx` `<main>`: `pb-16` → `pb-[calc(4rem_+_env(safe-area-inset-bottom))] lg:pb-0` — 하단 고정 내비가 홈 인디케이터를 가릴 때 본문 하단 여백이 인셋만큼 추가로 확보. `lg:` 데스크톱 레이아웃 픽셀 불변(인셋 0 → 기존과 동일).
  - `src/components/MobileBottomNav.tsx`: 고정 `<nav>` `h-14` → `h-[calc(3.5rem_+_env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]` (콘텐츠 높이 3.5rem 유지 + 인셋만큼 아래로 확장, `border-box`라 아이콘 영역 안 줄어듦). "더보기" 시트 `bottom-14` → `bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]`로 내비 신장분만큼 상향. 인셋 0(데스크톱/논노치) → 모두 기존과 픽셀 동일.
  - `scripts/check-app-packaging.mjs`: `layout.tsx`에 `export const viewport`·`viewportFit:"cover"`·`themeColor`·`appleWebApp` 존재 단언 4건 추가(오프라인·서버리스, standalone 속성 회귀 방지). `src/app/icon.svg`는 유효한 Next metadata 파일이라 **미변경**.
- **검증 게이트(전부 통과)**:
  - `npm run app:check` → **통과**(신규 4단언 OK 포함, 1 WAIT = `assetlinks.json` 미생성 = 기존 운영자 게이트, 회귀 아님).
  - `npm run build` → **Compiled successfully**, 라우트 표 무변경. 생성 CSS 검증: `calc(3.5rem + env(safe-area-inset-bottom))`·`calc(4rem + env(...))`·`padding-bottom:env(safe-area-inset-bottom)` 모두 **연산자 공백 포함 유효 CSS**로 방출(Tailwind arbitrary value의 `_`→공백 변환 확인).
  - `npm run lint` → 이 리포는 ESLint 미구성(`next lint`가 대화형 설정 프롬프트, eslint 의존성/config 없음) — **실사용 게이트 아님**. tsc는 build가 커버.
  - **브라우저 체크**(로컬 prod `npm run start`, `curl`로 SSR head·에셋): `<meta name="theme-color">` 라이트/다크 2종·`viewport ... viewport-fit=cover`(maximum-scale 없음)·`apple-mobile-web-app-capable=yes`·`...-status-bar-style=black-translucent`·`...-title=오른스코어`·`apple-touch-icon`·`manifest` 링크 전부 방출 확인. 에셋 `/manifest.webmanifest /icon.svg /icon-192.png /icon-512.png /icon-512-maskable.png /apple-touch-icon.png` **전부 200(아이콘 404 0)**. 매니페스트 파싱: `display:standalone`, icons `any/192/512/512-maskable`, shortcuts `/today /stocks /disclosures` — **설치 가능**. 로컬 prod 리스너(PID 35364)만 포트 PID로 종료, AI Center 프로세스 무중단.
- **⚠️ 운영자 조치 필요 (외부 유지 — 코드로 처리 불가)**:
  1. **Android TWA(1차 경로)**: Google Play Console 등록($25 1회), 패키지 `com.ornscore.app`, **실서명 SHA-256 지문** 확보 → `npm run app:assetlinks -- --package com.ornscore.app --fingerprint <SHA256>`로 `public/.well-known/assetlinks.json` 생성(현재 미생성 = `app:check`의 유일한 WAIT). Bubblewrap/PWABuilder로 TWA 래핑.
  2. **iOS App Store 래퍼 결정(보류)**: Apple Developer($99/년) + Mac/Xcode 필요. 현재 iOS는 사파리 '홈 화면에 추가'(이번 `appleWebApp` 메타로 standalone·상태바 정상)까지만 지원.
  3. **실기기 standalone QA**(`docs/app-packaging-readiness.md` §4): 설치 아이콘 화질, Kakao/Google/Naver OAuth 왕복 후 앱 복귀, 관심 종목 저장, 오프라인 폴백, 노치 기기에서 하단 내비가 홈 인디케이터를 가리지 않고 본문이 잘리지 않는지 육안 확인(코드 인셋은 반영 완료, 실기기 검증은 운영자 게이트).
- **재확인**: 스토어 제출 0 · 서비스워커 0 · 유료 플랜 0 · 숨겨진 AI 0 · 외부 대시보드 변경 0. 변경은 전부 로컬 리포·로컬 프리뷰 한정. Vercel 반영은 별도 오너 push 단계.
- **리뷰 회귀 수정(2026-07-02, 상단 노치 겹침)**: `statusBarStyle:"black-translucent"` + `viewportFit:"cover"`는 상태바/노치 영역까지 콘텐츠를 그리는데, `src/components/AppHeader.tsx`의 `sticky top-0` 상단바가 `env(safe-area-inset-top)`을 예약하지 않아 iOS 설치형 standalone에서 상단바가 상태바에 가려지던 문제. `<header>`에 `pt-[env(safe-area-inset-top)]` 추가 — 헤더 배경/블러가 상태바 영역을 채우고 콘텐츠는 인셋만큼 아래로 내려감. 인셋 0(데스크톱/논노치)에서 픽셀 불변. `scripts/check-app-packaging.mjs`에 `AppHeader.tsx`의 상단 인셋 단언 1건 추가(회귀 방지). `npm run build` 통과, 생성 CSS에 `padding-top:env(safe-area-inset-top)` 방출 확인.

### Task 125 — OrnScore 성능·신뢰성 패스 (`/watchlist` 타임아웃 가드 + 라우트 로딩 스켈레톤) (2026-07-02, Claude)
- **범위**: 무료 한국어 베타(138종목)의 체감·로드 속도와 신뢰성 개선. 점수식·`stocks.json`·인증/provider/env·DB 스키마·라우트 의미·`package.json` 의존성 무변경, 신규 npm **0**. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지. 변경 **3 소스**(`src/app/watchlist/page.tsx`·`src/app/watchlist/loading.tsx` 신규·`src/app/stock/[ticker]/loading.tsx` 신규) + docs.
- **신뢰성 — 마지막 미가드 요청 시점 원격 호출 봉인**: `watchlist/page.tsx`의 `getScoreChangesBatch(...)`가 유일하게 타임아웃 없이 Supabase를 요청 시점에 왕복하던 호출 → `today/page.tsx:45`·`stock/[ticker]/page.tsx:44` 와 동형의 로컬 `withTimeout` 헬퍼로 `withTimeout(getScoreChangesBatch(...), 4000, {} as Record<string, number>)` 래핑. 최악 TTFB를 4초로 캡하고 느리거나 실패 시 빈 델타로 graceful degrade(관심 종목 목록 자체는 무영향). 정상(캐시 적중) 시 미발화 → 동작·데이터 무변경.
- **체감 성능 — 라우트 로딩 스켈레톤(additive)**: 요청 시점 원격 조회가 있는 두 라우트에 순수 표시용 `loading.tsx` 신규(데이터 패칭·상태·의존성 0). `watchlist/loading.tsx`(헤더 + 5카드 목록 흉내), `stock/[ticker]/loading.tsx`(브레드크럼 + 결론 히어로 + 지표/차트 영역 흉내). 스타일은 `StockPriceChartLazy` 등 기존 스켈레톤과 동일(`animate-pulse`·zinc 톤·다크 변형), 실제 레이아웃 높이 미러링으로 CLS 최소화. 문구는 중립(유료/AI 문구 유출 0). **`today/loading.tsx`는 의도적 미추가** — `/today`는 `revalidate=3600` ISR 캐시라 빠르고 `TodayContent` 레이아웃이 복잡해 스켈레톤 불일치 CLS 리스크가 이득보다 큼.
- **빈/오류/모바일 6개 플로우 감사**: 홈·`/today`·`/stocks`·종목상세·`/compare`·`/login` — Task 110/124에서 이미 견고(빈 상태·`<noscript>` 폴백·try/catch·390px 가드) 확인, 재현 가능한 신규 갭 없음 → 추가 수정 0(스펙 커버리지 §O·최종점검 P1-1 근거).
- **step-5 정적화 defer(문서화)**: `/stock/[ticker]`는 이미 `●` SSG(138 경로 프리렌더)이고 task-119 4초 가드로 최악 TTFB가 캡되어 있음. `getScoreHistory`를 클라 lazy fetch로 분리하는 정밀 정적화는 '근거' 탭의 렌더 콘텐츠/타이밍을 바꿀 수 있어(zero-visible-change 보장 불가) **연기**. 잔여 후속 리스크로 기록.
- **검증 게이트(전부 통과)**:
  - `npx tsc --noEmit` → **0** · `git diff --check` → CRLF 노이즈만(실오류 0).
  - `npm run build` → **0**, 라우트 표 무변경(`/stock/[ticker]` 여전히 `●` SSG 138경로 189kB · `/watchlist` `ƒ` 168kB · `loading.tsx`는 라우트 항목 아닌 Suspense 경계만 추가).
  - `PYTHONUTF8=1 python scripts/verify_metrics.py` → **138종목·오류 0·Metrics 2.4 정합·금칙 브랜드 0**.
  - `npm run app:check` → **통과**(1 WAIT = `assetlinks.json` 미생성 = 기존 운영자 게이트, 회귀 아님).
  - **런타임 perf**(로컬 prod **4455**, `npx next start`, `perf:check` 3샘플 median TTFB): 11라우트 전부 200·경고 0. **`/watchlist` total 7076ms(task-120 baseline)→4051ms**(4초 가드 캡), `/stock/034730`·`/stock/032830` ~4.08s(task-119 가드 유지), Category-A 8종 29~54ms(회귀 없음, baseline 41~84ms 대비 오히려 빠름). TTFB 열은 스트리밍 SSR 셸로 전 라우트 29~51ms.
  - **스모크**(6플로우+watchlist: `/ /login /today /stocks /stock/034730 /compare /watchlist`): 전부 HTTP 200, 치명 마커(Application error/Hydration/TypeError/ReferenceError/Cannot read/Unhandled) **0**. SSR 한국어 정상("관심 종목" 렌더).
  - 변경 3소스 U+FFFD/모지바케 **0**(Korean intact). 로컬 prod **4455** 리스너(PID 38128)만 `taskkill` · **AI Center 4310 무중단(종료 후 PID 26420 LISTENING 확인)**.
- **남은 출시 리스크(운영자/후속)**: ① 무료 티어 Supabase 콜드 커넥션 고정비(환경 아티팩트, 프로덕션 동위치선 작음 — 인프라/오너 결정) ② Playwright 시각 게이트 미구성 → 데스크톱/390px 픽셀 육안은 운영자 수동 ③ 실기기 OAuth 왕복(매직링크·카카오)은 운영자 게이트 ④ step-5 `/stock/[ticker]` 완전 정적화(getScoreHistory 클라 분리) 연기 — 근거 탭 타이밍 검증 후 별도 착수 ⑤ 공시 전체 기간 수집·KRX 공식 업종코드 등 큰 데이터 작업은 스펙 커버리지 B/C절 유지.
- **오너용 요약**: ✅ 성능·신뢰성 패스 — 관심 종목 페이지의 마지막 미가드 원격 호출을 4초 타임아웃으로 봉인(최악 로드 7.1s→4.1s), 느린 두 라우트에 즉시 표시되는 로딩 스켈레톤 추가(체감 속도·CLS 개선). 점수식·데이터·인증·env·스키마·신규 npm 0. 외부 사이트(Vercel) 반영은 별도 오너 push 단계.

### Task 124 — 무료 베타 출시 준비도 심층 QA + 공시 필터 빈 상태 복구 버튼 (2026-07-02, Claude)
- **범위**: 무료 한국어 베타(138종목) 공개 표면 9개(홈·로그인·`/today`·`/stocks`·종목상세·비교·공시·모바일·빈/로딩/오류 상태) 심층 출시 준비도 QA. 불변식(무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보) 유지 확인 + 발견된 실사용 갭 1건에 안전한 additive 수정. 점수식·`stocks.json`·인증/provider/env·DB 스키마·라우트·의존성 무변경, 신규 npm 0. 변경 **2 소스**(`src/lib/copy/disclosures.ts`·`src/components/DisclosureExplorer.tsx`)+docs.
- **불변식 재검증(런타임+grep, 113~123 전환 완료 확인)**:
  - `LanguageSwitcher` importer 0(헤더·모바일드로어 미렌더) · 홈 SSR에 `언어 전환/English` 0건 → 한국어 전용 유지.
  - `AiAnalysisCard`는 종목상세에서 미렌더(코드/API는 보존, 공개 진입점만 차단) · `/stock/034730` SSR에 `AI 분석 실행/Anthropic` 0건.
  - `/history` 내비 제거 · `/pricing`은 Sidebar·MobileNav·MobileBottomNav 모두 "더보기(MORE)" 그룹으로 강등(1차 내비 아님).
  - 유료/Pro/Premium/구독/결제 문자열은 `pricing/terms/waitlist/features/pricing.ts/auth·providers`(내부 코멘트)에만 존재 — 공개 표면 누출 0. `/pricing` SSR "무료 베타" ×7·확정 가격 숫자(9,900/14,900/29,000) 0건.
- **발견/수정(P2 실사용 갭)**: 공시 탐색(`/disclosures`)의 필터 빈 상태가 `filterType !== "all"`(특정 유형 선택 후 scope 전환 등으로 0건)일 때도 안내 문구만 노출하고 복구 경로가 없었음(`/stocks`·`/watchlist` 빈 상태는 이미 복구 버튼 제공). → `DisclosureExplorer` 빈 상태에 **필터 해제(전체 신호 보기) 버튼**을 additive 추가(`filterType !== "all"`일 때만; 전체 피드가 0건인 경우엔 기존 문구 유지). `copy/disclosures.ts` ko/en 양쪽에 `emptyReset` 키 신설. `setFilterType("all")`은 기존 "전체" 버튼과 동일 동작 재사용 — 필터/정렬/카운트/신호 로직 무변경.
- **게이트(변경 트리 전수)**: `npx tsc --noEmit` 0 · `PYTHONUTF8=1 python scripts/verify_metrics.py`(138종목 오류 0건·금칙어 0·Metrics 2.4) 0 · `npm run build` 0(176 SSG·48 라우트, 라우트 표 무변경) · `npm run app:check` 0(WAIT assetlinks 1건은 기존 운영자 외부 게이트) · `git diff --check` clean · 변경 2 소스 U+FFFD 0(Korean intact). `emptyReset` Korean 문자열이 `disclosures/page-*.js` 클라 청크에 컴파일됨 확인.
- **스모크(로컬 prod 4455, 리스너 PID만 taskkill·AI Center 4310 PID 26420 무중단 확인)**: 13개 라우트(`/ /login /today /stocks /stock/034730 /stock/032830 /compare /disclosures /watchlist /pricing /about /status /backtest`) 전부 200, 8개 주요 표면 치명 마커(Application error/Hydration/TypeError/ReferenceError/Cannot read/Unhandled) 0건. `/status` 기준일 `2026.07.01`(일일 리프레시 반영·status 정상)·Metrics 2.4 일관. `/compare` 빈 상태·`/disclosures` "최신 200건" 캡션 렌더.
- **QA 결론**: 120+ 태스크 누적으로 이미 강건화된 코드베이스라 신규 실버그 0(빈/로딩/오류 상태·모바일 가드 모두 기존 처리 견고). 유일한 실개선 = 위 공시 빈 상태 복구 버튼. Playwright 미구성이라 데스크톱/390px **실 브라우저 픽셀 게이트는 운영자 육안 잔여**(대기⑤).
- **다음 즉시 작업/운영자 게이트**: (1) 운영자 실기기 카카오·구글·네이버 OAuth 왕복 + standalone 콜백. (2) 데스크톱/390px 실 브라우저 육안(오버플로·콘솔 0). (3) Playwright 시각 게이트 구성(반복 잔여). 푸시/릴리스 미수행(task 브랜치 로컬 커밋만).

### App packaging decision lock — Android TWA 우선 확정 (2026-07-01, Codex)
- **제품 결정**: 오너와 함께 OrnScore 앱 1차 패키징 경로를 **Android TWA 우선**으로 확정. iOS는 홈 화면 추가 PWA로 유지하고, App Store 정식 래퍼는 Android TWA와 실사용 피드백 이후 검토한다.
- **패키지명 기본값**: `com.ornscore.app`. Play Console 앱 생성 직전 운영자가 최종 확인해야 하며, 실제 `public/.well-known/assetlinks.json`은 서명 SHA-256 확보 전까지 생성하지 않는다.
- **반영 파일**: `docs/app-packaging-readiness.md`, `docs/app-store-submission-pack.md`, `docs/ornscore-owner-final-checklist.md`, `docs/app-roadmap.md`, `scripts/check-app-packaging.mjs`, `PROGRESS.md`.
- **가드**: `npm run app:check`가 Android TWA 우선 결정·iOS 정식 래퍼 보류·`com.ornscore.app` assetlinks 명령·미결정 문구 재유입을 검사한다.
- **다음 게이트**: 실기기 standalone OAuth 복귀 확인 → Play Console 등록 → package id 최종 확인·서명 SHA-256 확보 → `npm run app:assetlinks -- --package com.ornscore.app --fingerprint "<SHA-256>"` → `npm run app:check`.

### App packaging prep — 스토어 제출 초안/검증 가드 최신화 (2026-07-01, Codex)
- **상태**: PWA manifest·아이콘·설치 도우미·assetlinks 예시는 기존 작업으로 준비되어 있었고, 이번에는 앱 패키징 문서/자동 체크를 현재 공개 베타 상태와 동기화했다.
- **수정**: `docs/app-store-submission-pack.md`를 무료 베타·유료 결제 없음·AI 공개 비노출·Kakao/Google/Naver 로그인 활성·현재 privacy 위탁 처리자(Supabase/Vercel/Resend/Kakao/Google/Naver)에 맞춤. `docs/app-packaging-readiness.md`에는 현 추천 경로(PWA 실기기 QA → Android TWA 우선, package id 후보 `com.ornscore.app`)를 추가. `docs/ornscore-owner-final-checklist.md`도 최신화.
- **가드**: `scripts/check-app-packaging.mjs`가 이제 스토어 제출 초안의 낡은 `Naver는 준비 중`·`AI 분석 기록`·`Anthropic` 문구와 무결제/제공자 정합성을 함께 검사한다.
- **검증**: `npm run app:check` 0. `WAIT public/.well-known/assetlinks.json` 1건은 정상 — 실제 Android package id와 서명 SHA-256이 생기기 전에는 생성하지 않는다.
- **다음 게이트**: 오너 실기기 standalone OAuth 복귀 확인 → Android TWA 진행 결정 → Play Console 등록 → 실제 package id/SHA-256 확보 → `npm run app:assetlinks -- --package <패키지명> --fingerprint "<SHA-256>"` 후 배포/재검증.

### P0 flow feedback closeout — 공개 전 AI/날짜/관심종목 잔여 정리 (2026-07-01, Codex)
- **입력**: `C:\Users\dongy\OneDrive\바탕 화면\ornscore_p0_flow_test_feedback_2026-07-01.md`.
- **재확인**: 공개 배포본의 주요 목록/정책/로그인/상태 라우트는 `2026.06.30` 기준일을 노출. 종목 상세의 `2026-06-29`는 히스토리 배열의 과거 날짜이고, `/privacy`의 `2026-06-29`는 데이터 기준일이 아닌 정책 최종 갱신일이라 `2026-07-01`로 갱신.
- **수정**: 로그인/기록/개인정보/요금제 공개 표면에서 AI 분석 홍보·Anthropic·예상 Pro/Premium 가격 숫자 흔적을 낮춤. `WatchlistClient`에는 hydration guard를 추가해 no-JS fallback과 클라이언트 loading 상태가 동시에 보이지 않게 함.
- **검증**: `git diff --check` 0(CRLF 경고만), `npx tsc --noEmit` 0, `npm run build` 0. 로컬 prod 4454에서 `/login`·`/privacy`·`/pricing`·`/watchlist`·`/history` 200 및 옛 AI/Anthropic/예상 가격/loading SSR 문구 0건 확인.
- **오너 게이트**: 카카오·구글·네이버 실제 OAuth 왕복, 로그인 후 `/watchlist`·`/compare`·`/settings/notifications`, 모바일 카카오톡 인앱 브라우저 콜백은 계정/콘솔 세션이 필요해 오너가 직접 확인해야 함. AI 기능을 다시 공개하면 개인정보처리방침의 AI/Anthropic 처리 고지를 복구해야 함.

### Launch-copy cleanup — 무료 베타 공개 배포 전 유료 문구 잔여 제거 (2026-07-01, Codex)
- **상태**: `main` 배포 후 공개 `ornscore.com` 핵심 라우트가 200 응답임을 확인했고, 출시 후보로 판단. 다만 `/pricing` 법무 고지에 남아 있던 `유료(Pro·Premium)` 문구가 무료 베타 v1 방향과 충돌할 수 있어 `src/lib/copy/pricing.ts`에서 현재 유료 기능 미제공·향후 확장 시에도 정보 확인/변화 알림/리서치 보조 범위라는 표현으로 정리.
- **불변식**: 무료 베타·한국어 우선·138종목·비자문 데이터 도구·AI 비홍보 유지. 점수식, 생성 데이터, 인증/provider/env, 결제, DB 스키마, 라우트 구조, 신규 npm 의존성은 건드리지 않음.
- **검증**: `git diff --check` 0(CRLF 경고만), `npx tsc --noEmit` 0, `npm run build` 0. 소스 `/pricing` 관련 파일에서 `유료(Pro·Premium)`/`Paid (Pro · Premium)` 잔여 0. `main` push 후 공개 `/pricing` 잔여 문자열을 재확인하면 된다. 이후 오너가 피드백/실사용 로그인/법무·데이터 소스 최종 판단을 이어가면 된다.

### Task 120 — 성능 가드레일 (perf-check 타이밍 스크립트 + 예산/경고 임계 + 측정 체크리스트) (2026-06-30, Claude)
- **범위**: task 118(클라 번들)·119(서버 TTFB/원격 지연)의 성능 발견을 **가드레일로 고정** — 향후 작업이 핵심 페이지를 다시 느리게 만들지 않도록 경량 측정 도구·문서화. 점수식·`stocks.json`·인증/env/스키마/결제 무변경, 신규 npm 0(Node 내장만), 시각/동작/라우트 무변경, 불변식 유지. 변경 **4파일**(`scripts/perf-check.mjs` 신규·`package.json` 1줄·PROGRESS·AI_HANDOFF).
- **세 관심사 분리(가드레일 핵심)**: (1) **클라 번들 크기** = `npm run build` 라우트 표 First Load JS(task 118: `/stock/[ticker]` 191→189kB·최대 라우트) — 스크립트 미측정. (2) **서버 TTFB** = 응답 헤더까지 시간(스크립트 측정). (3) **원격 데이터 지연** = Category-B−Category-A TTFB 차이(task 119: 종목상세 요청 시점 Supabase `daily_scores` 왕복; 무료 티어 연결 고정비 = 환경 아티팩트, 프로덕션선 작음). 원인·해결책이 달라 별개 추적.
- **신규 `scripts/perf-check.mjs`**(ESM·ASCII·Node 내장 `fetch`+`performance.now()`, `check-app-packaging.mjs` 스타일): **이미 떠 있는 로컬 prod 서버만 타이밍**(기동/종료 안 함). `--base`(또는 `PERF_BASE_URL`, 기본 `http://localhost:4452`)·`--samples`(기본 3). 11개 핵심 라우트의 라우트별 **median TTFB·총 다운로드**를 표로 출력, **항상 exit 0**(절대값은 PC/네트워크 의존이라 비차단), 복붙용 baseline 블록 출력.
- **소프트 예산/경고**: Category A(대조/빠름: `/`·`/stocks`·`/status`·`/pricing`·`/login`·`/disclosures`·`/backtest`·`/compare`) **≤ 800ms** 초과 WARN. Category B(원격 데이터: `/stock/034730`·`/stock/032830`·`/watchlist`) **≤ 9000ms** 초과 WARN — task-119 타임아웃이 `/stock/*`를 ~4–4.5s로 캡한다는 주석 포함. **상대 회귀 우선**: PROGRESS.md baseline 대비 **>50%(또는 Category-A >300ms)** 증가 라우트 의심 — 스크립트가 명시 출력.
- **`package.json`**: `scripts`에 `"perf:check": "node scripts/perf-check.mjs"` 1줄만. `dependencies`/`devDependencies` 바이트 동일, lockfile·node_modules 무변경.
- **반복 체크리스트**(스크립트 없이도): `npm run build` → **4310 아닌 고포트** `npx next start -p 4452` → `node scripts/perf-check.mjs --base http://localhost:4452`(또는 `npm run perf:check -- --base http://localhost:4452`) → median 표를 새 baseline으로 PROGRESS.md 기록 → **그 리스너만** `netstat -ano | findstr :4452` → `taskkill /PID <pid> /F`, **4310 LISTENING 확인**.
- **이번 실행 baseline**(로컬 prod 4452, 3샘플 median TTFB): `/`=84ms · `/stocks`=72ms · `/stock/034730`=**4077ms** · `/stock/032830`=**4068ms** · `/login`=43ms · `/pricing`=42ms · `/status`=41ms · `/disclosures`=65ms · `/backtest`=54ms · `/watchlist`=**7076ms** · `/compare`=56ms. 전 라우트 200, A 8종 ≤800ms, B 가드 상한 정합, 경고 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG·라우트 표 무변경) · `git diff --check` 0 · 변경 4파일 U+FFFD 0(Korean intact)·신규 의존성 0. 가드레일 end-to-end 1회 실행 성공. 로컬 prod **4452**(리스너 PID 28560만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**). 외부 사이트(Vercel) 반영은 별도 오너 단계.

### Task 119 — 종목 상세 TTFB/서버 지연 안전 개선 (요청 시점 원격 Supabase 호출 타임아웃 가드 + 읽기 전용 캐시) (2026-06-30, Claude)
- **범위**: task 118 후속 — `/stock/[ticker]` 의 **서버 데이터 패칭·원격 Supabase 왕복 비용**에 집중(118은 클라 번들 축소). 시각/동작/데이터/점수/인증/env/스키마 무변경, 신규 npm 0, 무료 베타·한국어 전용·138종목·비자문·AI 비홍보 불변식 유지. 변경 **2파일**(`src/lib/scoreHistory.ts`·`src/app/stock/[ticker]/page.tsx`)+docs.
- **측정 baseline(로컬 prod 4441, curl, 3샘플 median TTFB)**: `/stock/034730` **7.12s** · `/stock/032830` **7.10s** · `/` 48ms · `/stocks` 51ms · `/status` 28ms. 대조 3종은 빠르고 종목상세 2종만 ~7.1s → 지연원은 렌더 CPU·클라 번들이 아니라 **서버의 원격 Supabase 호출**.
- **근본 원인 규명(코드/런타임 실측)**: 종목상세의 유일한 요청 시점 원격 호출 = `getScoreHistory(ticker,30)`(Supabase `daily_scores`). `getPriceHistory` 는 로컬 fs 읽기(61KB, 빠름). 결정적 발견 — **이 라우트는 빌드 표에 `●(SSG)` 로 표기되지만 실제로는 매 요청 동적 렌더**(prerender HTML 디스크에 없음, 응답 `Cache-Control: private, no-cache, no-store`). 원인은 **supabase-js 의 no-store fetch 가 라우트를 동적으로 강등**(서버 모듈에 `cookies/headers/force-dynamic` 전무 — 유일 트리거). 그래서 매 요청 7s 원격 왕복 발생. **7s 자체는 환경 아티팩트**: task 118 에서 단일 종목 쿼리와 138-배치 쿼리가 **동일하게 ~7080ms** → 쿼리 실행시간이 아니라 로컬→원격(무료 티어) Supabase **연결/웜업 고정비**. 프로덕션(Vercel·동위치 Supabase·풀링)에서는 작음.
- **적용 1 — 타임아웃 가드(검증된 안전 개선)** `page.tsx`: `today/page.tsx` 와 동일한 로컬 `withTimeout` 헬퍼를 추가해 `Promise.all` 안의 `getScoreHistory` 를 `withTimeout(getScoreHistory(ticker,30), 4000, [])` 로 감쌈. 원격이 느리거나 멈춰도 4초 후 빈 배열로 떨어져 렌더·빌드·ISR 재생성이 무한 대기하지 않음. **로컬 TTFB: `/stock/*` 7.1s→4.1s 로 상한 캡**. 프로덕션(웜 Supabase <1s)에서는 4초 한참 전에 반환 → **동작 무변경**. 점수 히스토리는 **기본 탭이 아닌 '근거' 탭**의 보조 데이터(`ScoreHistoryChart`+`StockEventTimelineLazy`)라, 타임아웃 시 차트/타임라인만 빈 상태로 graceful degrade(기존 '히스토리 없음' 상태와 동일) — 결론 히어로·4지표·재무·공시 탭 무영향.
- **적용 2 — 읽기 전용 캐시 래퍼** `scoreHistory.ts`: `daily_scores` 조회를 `unstable_cache`(키 `[score-history, ticker, days]`·`revalidate:3600`·tag)로 감쌈. **빈 폴백을 캐시에 굳히지 않도록** 내부 `fetchScoreHistory` 는 오류 시 throw(정상·정당한 빈 결과만 캐시, 일시적 오류는 재시도), 외부 `getScoreHistory` 가 try/catch 로 `[]` graceful. 페이지 `revalidate=3600` 과 동일 신선도(daily_scores 는 1일 1회 배치). **로컬 next start 의 동적 no-store 요청 컨텍스트에서는 이 캐시가 우회되어 로컬 수치 변화는 없음**(검증), 다만 **프로덕션 Vercel Data Cache 에서는 revalidate 창 안 같은 키 반복 조회를 중복 제거**해 원격 왕복 비용을 줄임. 점수 산식·데이터 무변경, 읽기 전용 조회만 캐시.
- **측정 after(동일 3샘플 median)**: `/stock/034730` **4.10s** · `/stock/032830` **4.07s**(둘 다 가드 상한) · `/` 70ms · `/stocks` 78ms · `/status` 36ms(대조 무변동, 정상). 종목상세 200·SSR(ko) — 4지표(추세·거래활성도·밸류·위험조정)·결론 히어로(종합 점수)·근거 탭 구조(점수 근거·이상값 점검) 모두 렌더, 점수 히스토리 타임아웃으로 빈 상태여도 탭 깨지지 않음. AI 종합 분석/분석 기록/LanguageSwitcher 0.
- **지연 근본 귀속 결론**: **원격 Supabase 네트워크 왕복**(서버 렌더 CPU·클라 번들 아님). 로컬 7s 는 무료 티어 원격 연결 고정비(환경). 라우트가 동적이라 매 요청 호출이 발생하는 **구조적 부분**은 코드 사안.
- **후속(behavior change 라 이번 미적용·정밀 계획)**:
  1. **`/stock/[ticker]` 완전 정적화** — 점수 히스토리를 '근거' 탭의 **클라이언트 지연 패치**로 이행(이미 클라 패칭하는 `StockEventTimelineLazy` 와 동형). 서버의 유일한 원격 호출이 사라져 라우트가 정적 프리렌더로 복귀 → **모든 환경에서 요청당 Supabase 왕복 제거**(TTFB ~50ms). API 라우트/클라 컴포넌트 추가라 동작 변경 → 별도 작업.
  2. **`/watchlist` 138-ticker 배치 쿼리**(task 118 미해결 잔존) — 매 요청 `getScoreChangesBatch`. 동일하게 캐시/타임아웃 또는 클라 이행 검토.
  3. **불가피 잔여(인프라/오너 결정)** — 무료 티어 Supabase 콜드 연결 고정비는 코드로 제거 불가(스키마/env/인프라: 풀링·웜 인스턴스·엣지 캐시 결정 필요).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(`/stock/[ticker]` 138 SSG 표기·라우트 표 무변경) · `git diff --check` 0(LF→CRLF 경고만) · 변경 2파일 U+FFFD/모지바케 0(Korean intact). 로컬 prod **4441**(`next start`, 리스너 PID 만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 대조 3종·종목상세 2종 200.
- **오너 요약**: ✅ 종목상세 TTFB/서버 지연 안전 개선 — 지연 원인은 **원격 Supabase 네트워크 왕복**으로 규명(렌더/번들 아님). 타임아웃 가드로 **최악 TTFB 7.1s→4.1s 캡**(프로덕션 무변경), 읽기 전용 캐시 래퍼 추가(프로덕션 Data Cache 중복 제거). 완전 정적화(점수 히스토리 클라 지연 이행)는 동작 변경이라 정밀 후속으로 문서화. 점수식·데이터·인증·env·스키마·신규 npm 0, 불변식 유지. 외부 사이트(Vercel) 반영은 별도 오너 단계.

### Task 118 — 안전 1차 성능/속도 패스 (측정 + 종목 상세 below-fold 클라 위젯 지연 로딩) (2026-06-30, Claude)
- **범위**: 무료 베타 공개 표면을 **시각/동작/데이터/점수/인증/라우트 의미 무변경**으로 유지하며 ORNScore 체감·로드 속도 1차 개선. 신규 npm 0, 점수식·`stocks.json`·인증/env/결제 무변경, AI 숨김·한국어 전용·138종목·비자문 불변식 유지. 변경 = **종목 상세 1개 라우트의 클라이언트 번들만**(page.tsx 1 수정 + 지연 래퍼 3 신규).
- **Phase 1 측정(baseline, `npm run build` 라우트 표 · 10개 과제 라우트 First Load JS)**: `/` 118kB · `/stocks` 183kB · `/stock/[ticker]` **191kB**(페이지별 32kB·**가장 큼**) · `/login` 170kB · `/pricing` 102kB · `/status` 133kB · `/disclosures` 179kB · `/backtest` 128kB · `/watchlist` 168kB · `/compare` 167kB · 공유 87.2kB. **최대 페이지 청크 = `app/stock/[ticker]/page.js` 113,420 B(raw)**(`.next/static/chunks` 실측). 공유 최대 청크는 supabase 포함 699(189KB)·framework 53.6KB.
- **Phase 1 HTTP TTFB(로컬 prod 4431, curl, 3샘플 median)**: 8개 라우트 **20~64ms**. **단 `/stock/034730`·`/watchlist`는 ~7,080ms** — 둘 다 서버에서 Supabase `daily_scores` 조회(`getScoreHistory`·`getScoreChangesBatch`, `@supabase/supabase-js`). **이 7초는 로컬 머신→원격 Supabase 왕복 지연(환경 아티팩트)**: 프로덕션(Vercel·Supabase 동위치)에서는 빠르고 `/stock/[ticker]`는 SSG라 운영 시 프리렌더 HTML 서빙(라이브 쿼리 아님). 코드 결함 아님 → 데이터 패칭 변경은 동작 리스크라 **후속(follow-up)으로 문서화**.
- **Phase 2 적용된 안전 개선**: 종목 상세에서 **첫 페인트에 불필요한 클라 위젯 3종을 `next/dynamic({ ssr:false })`로 지연 로딩** → 초기 번들에서 분리, 동일 높이 스켈레톤으로 CLS·SSR 텍스트 보존.
  - `src/components/StockPriceChartLazy.tsx`(신규) — 인터랙티브 SVG 가격 차트(hover/range 상태) 래퍼. 히어로 아래·접힘선 위치.
  - `src/components/StockDisclosuresLazy.tsx`(신규) — 공시 탭(기본 탭 아님, `useEffect`로 클라 패칭) 래퍼.
  - `src/components/StockEventTimelineLazy.tsx`(신규) — 근거 탭(기본 탭 아님, 클라 패칭) 래퍼.
  - `src/app/stock/[ticker]/page.tsx` — 위 3개를 lazy 래퍼로 교체(props/문구/조건/데이터 동일). `ssr:false`는 서버 컴포넌트에서 직접 못 써 클라 래퍼로 분리.
  - **`ScoreHistoryChart`는 일부러 미변경** — `"use client"` 아님(순수 서버 컴포넌트, 클라 JS 0) → 지연 로딩 이득 없음(오히려 클라화 손해). 플래너의 "차트 2종" 중 실제 JS 비용은 `StockPriceChart`뿐.
  - **lucide-react `optimizePackageImports`는 추가했다가 되돌림** — Next 14.2 기본 `optimizePackageImports`에 lucide-react가 **이미 포함**되어 라우트 표가 **바이트 단위 동일**(no-op). 불필요한 experimental 블록 회피로 diff 최소화(`next.config.mjs` 원본 그대로).
- **Phase 2 before→after(빌드 라우트 표)**: `/stock/[ticker]` First Load **191kB → 189kB**, 페이지별 **32kB → 29.4kB**. 나머지 9개 라우트 무변경(예상대로 — 변경이 상세 라우트 한정). **raw 페이지 청크 113,420 B → 94,650 B(−18.8KB, ~16.5%↓)**, 분리된 지연 청크 3개 생성(차트 6,079B·공시 6,888B·타임라인 3,254B ≈ 16.2KB가 첫 로드에서 빠져 탭/하이드레이션 후 로드).
- **TTFB after(동일 측정)**: 8개 라우트 여전히 ~37~69ms, `/stock`·`/watchlist` 여전히 ~7,080ms — **변동 없음이 정상**: TTFB는 서버 응답 시간이라 클라 번들 축소가 영향 주지 않음(개선은 다운로드/파싱/실행하는 JS 감소=체감 로드). 두 라우트의 7초는 위 Supabase 환경 아티팩트로 불변.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 SSG 유지·라우트 의미 무변경) · `git diff --check` 0 · 변경/신규 파일 U+FFFD 0. 로컬 prod **4431**(리스너 PID만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 10라우트 전부 200. `/stock/034730` SSR(ko) — 추세/거래활성도/밸류/위험조정·결론 히어로 렌더, **차트 스켈레톤(`aria-busy`+"주가 차트")이 SSR HTML에 존재**(빈 공백 없음·CLS 가드), 제품 불변식 유지(AI 종합 분석/분석 기록 0·LanguageSwitcher 0·138 노출).
- **이연(follow-up, 동작 리스크라 이번 미적용)**:
  1. **`/watchlist` 서버 Supabase 배치 쿼리(138 ticker)** — 매 요청 `getScoreChangesBatch`. 프로덕션은 빠르나 캐시/타임아웃 가드 또는 클라 이행 검토(데이터 패칭 변경=동작 리스크).
  2. **`/stock/[ticker]` `getScoreHistory`** — SSG라 운영 영향 작지만 빌드 시간/로컬 측정 지연 원인. 타임아웃·재시도 가드는 동작 변경이라 보류.
  3. **`GlobalSearch` props** — 헤더가 매 페이지 138종목(`{ticker,name,themes}`)+테마를 직렬화 전달. `themes`는 `themeHint`/테마 검색에 실사용 중이라 축소는 검색 동작 리스크 → 보류.
  4. **추가 below-fold 위젯**(예: `/compare`·`/disclosures`의 무거운 클라 컴포넌트) 동일 패턴 지연 로딩 — 본 패스는 최대 라우트(상세)만.
- **오너 요약**: ✅ 안전 1차 성능 패스 완료 — 최대 라우트(종목 상세) 초기 클라 JS **−18.8KB raw / First Load 191→189kB**, 시각·동작·데이터·점수·인증·라우트 의미·불변식 무변경. 외부 사이트(Vercel) 반영은 별도 오너 단계. 로컬 커밋만(푸시/릴리스 미수행).

### Task 116 — `ornscore_reaudit_2026-06-29.md` 잔여 스윕 (무료 베타 정리 이후 재검수, 잔여 1건 수정) (2026-06-30, Claude)
- **범위**: 데스크톱 `ornscore_reaudit_2026-06-29.md`(P0 2·P1 8·P2 6)를 현행 코드와 대조하는 잔여 스윕. 이 파일은 task 113~115(무료 베타 전환)보다 이전 작성본 — 항목 대부분 이미 task 99~102·108~110에서 마감. **현행 앱에서 아직 참인 항목만** 소규모 저위험 패치. 변경 **1파일**(+PROGRESS·AI_HANDOFF).
- **유일 수정(아직 참이던 P0-1 잔재)** `src/lib/copy/stocks.ts` `topCapNote`(ko+en): `/stocks` 결과>100(기본 123) 푸터의 `"조건 충족 N개 중 상위 100개 표시"` — task 109가 중립화한 캐논 용어("현재 표시"/"기본 품질 필터")와 어긋나 **사용자 조건이 없는 기본 화면에서 "조건 충족"이 오해 유발**(P0-1 원지적). ko `"현재 표시 대상 N개 중 상위 100개만 표시 · …"`, en `matches`→`results`로 통일. 카운트/캡/정렬 무변경.
- **이미 마감(재확인·무변경)**: P0-1 `/stocks` 123/138 충돌(task 99·109) · P0-2 `/status` KST/UTC(task 99) · P1-1 `/terms` 내부 경로 제거(task 99) · P1-2 홈/공시 카운트 라벨(task 100) · P1-3·4 `/watchlist`·`/compare` 빈/noscript(task 100·110) · **P1-5 요금제 표 → task 114로 무효화**(무료 베타 단일면, 권고 재도입 금지) · P1-6 홈/상세 순위 기준(task 100·110) · P1-7 업종 카운트 "본인 포함" 통일(task 102) · P1-8 로그인 "1초 만에" 제거(task 101) · P2-1 데이터 배지 분리(task 102) · P2-2 STEP ol>li(task 102) · P2-3 공시 CTA/배지 분리(task 102) · P2-4·5 백테스트 % 단위·생성일 배지(task 102·112) · P2-6 밸류 업종 미보정 경고(task 102).
- **남은 항목 = 오너/법무/사업**(개발 수정 아님): 도메인 support@/privacy@ 이메일, 위탁사 정책 링크, SEO 메타/OG/구조화 데이터, 실기기 390px 육안(Playwright 미구성), 결제/환불/청약철회 약관 확정.
- **검증**: `tsc` 0 · `build` 0(138 SSG) · `git diff --check` 0 · 변경 1파일 U+FFFD 0. 로컬 prod **4427**(리스너 PID만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 13라우트 전부 200, SSR(ko) 단언 14종 통과(`/stocks` 신규 캡 문구 노출·옛 `조건 충족 123 … 상위 100` 0 외).

### Task 115 — Free Beta v1 QA pass (공개 표면 정합 검증 + 18라우트 스모크) (2026-06-30, Claude)
- **범위**: task 114 공개 표면 정리 후 **무료 베타 v1 QA**(주로 검증). free beta·한국어 전용·138종목·유료 미제공·투자자문 아님·AI 숨김/비홍보·카카오/앱스토어 로드맵 한정·로그인=저장/동기화·약관/개인정보 비과장을 정적 스윕 + SSR(ko) 단언으로 확인. 확인된 P0/P1 모순 **1건만** 보수 수정. 변경 **1파일**(+PROGRESS·AI_HANDOFF).
- **유일 수정(P1)** `src/components/UserMenu.tsx`: 로그인 계정 드롭다운에 `/history`(AI "분석 기록"·`Bot` 아이콘) 링크가 잔존 — task 114가 3개 내비에서 제거한 AI 진입점과 불일치(수용 기준 "AI 숨김/비홍보" 위반). **링크 + 미사용 `Bot` import 제거**(라우트/페이지/AI 코드 보존, 홍보만 제거).
- **검증 통과(무변경)**: `AiAnalysisCard` 상세 렌더 0 · `LanguageSwitcher` 렌더 0 · `LanguageProvider` 기본 한국어 · `LegalEnSummary` SSR(ko)=null(영어 법무 본문 비노출) · `/pricing` 무료 베타만(플랜 그리드/waitlist/Pro전환/곧유료 0)·`nav.pricing`="베타 안내"·more 그룹 · 알림 카카오 로드맵 톤 · 약관 유료=출시예정/초안/현재 미제공 · 개인정보 Anthropic/AI 고지=안전장치(유지) · 영어/네이티브앱 출시 약속 0.
- **18라우트 스모크(로컬 prod 4423)**: `/`·`/today`·`/stocks`·`/stock/034730`·`/disclosures`·`/backtest`·`/compare`·`/pricing`·`/status`·`/privacy`·`/terms`·`/watchlist`·`/settings/notifications`·`/about`·`/universe`·`/history`·`/login`·`/guide/metrics` **전부 200**. SSR(ko) — `/pricing` "무료 베타"·waitlist/Pro전환/Premium 0 · `/stock/034730` "AI 종합 분석"/"분석 기록" 0 · 헤더 "베타 안내"·LanguageSwitcher/`/history` 0 · `/terms`·`/privacy` 영어 본문 0·한국어 노출. (UserMenu=로그인 게이트라 SSR 미노출 → 소스+build+tsc 검증.)
- **검증**: `tsc` 0 · `build` 0(138 SSG, `/pricing`·`/history`·`/terms`·`/privacy` 잔존) · `git diff --check` 0 · 변경 1파일 U+FFFD 0. 로컬 prod **4423**(PID 36920만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**).
- **오너 요약**: ✅ 무료 베타 리뷰 준비 완료(공개 P0/P1 범위 모순 0, AI 진입점 잔여 1건 수정). ⏳ 추후 오너/법무/사업: 카카오 알림 실발송·앱스토어 제출·수익화 활성화·EN 재개(코드 보존). 외부 사이트(Vercel) 반영은 별도 오너 단계.

### Task 114 — Free Beta v1 공개 표면 적용 (요금제→무료 베타 안내·AI/기록 숨김·한국어 전용·카카오 로드맵 알림) (2026-06-30, Claude)
- **범위**: task 113 결정문서(`docs/ornscore-free-beta-v1-scope.md`) 구현 체크리스트 (i)1~5 + 요금제 리워크를 **공개 앱 표면에 실제 적용**. 표시/내비/문구 + 클라 기본 로케일만(점수식·`stocks.json`·인증·cron·`features.ts`·`pricing.ts`/`PLANS`·EN i18n 데이터·manifest·앱 로드맵 무변경, 신규 npm 0, 라우트 삭제 0, 매수/매도/추천 0). 변경 **12파일**(+PROGRESS·AI_HANDOFF).
- **요금제→무료 베타 안내**: `copy/pricing.ts` `freeBeta` 키 신설(ko/en) + `PricingContent.tsx` 전면 재작성(공개=백홈·무료 베타 헤드라인/본문·무료 포함목록 6종[138종목 포함, AI 제외]·§13.2 법무만). **공개 제거**: 3-플랜 그리드·Pro/Premium 비교표·"Pro 전환" 베타카드·"가격 미확정"·`WaitlistForm`. 옛 키·`WaitlistForm`·`plansByLocale` 등은 **파일 보존(내부/추후)**. `pricing/page.tsx` 메타 무료 베타 톤.
- **내비**: `i18n.ts` `nav.pricing`/`footer.pricing` ko "요금제/요금"→**"베타 안내"**(en "Beta info"). `/pricing` 라우트 유지. `Sidebar`·`MobileNav`에서 `/pricing` 1차→**more 그룹 이동**.
- **AI 공개 숨김(코드 보존)**: `stock/[ticker]/page.tsx` `<AiAnalysisCard>` 렌더+import 제거. `/history` 내비 항목 3곳(`Sidebar`·`MobileNav`·`MobileBottomNav`) 제거 — **라우트·`nav.history` 키·`AiAnalysisCard.tsx`·`api/ai/*`·`history/page.tsx`는 보존**(직접 접근 가능, 홍보만 제거).
- **한국어 전용**: `AppHeader`·`MobileNav` `<LanguageSwitcher>` 렌더+import 제거(컴포넌트·EN 문자열 보존). `LanguageProvider` 기본 폴백 `preferredBrowserLocale()`→`DEFAULT_LOCALE`(명시적 저장/`?lang=`만 내부 EN 존중).
- **알림 카카오 로드맵 톤**: `settings/notifications/page.tsx` 상단+비로그인 카피를 로그인 매직링크 메일↔제품 알림 분리 + 제품 알림 우선=**카카오톡(준비 중·미발송)**, 이메일=임시 채널(장기 메인 아님). `alertCatalog.ts` `saved_filter_match` 이메일 단정 문구 임시/로드맵 톤화. cron·status 데이터 무변경.
- **검증**: `tsc` 0 · `build` 0(138 SSG, `/pricing` 8.12kB·`/history` 라우트 잔존) · `git diff --check` 0 · 12파일 U+FFFD 0(Korean intact). 로컬 prod **4422**(PID 36716만 `taskkill`·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 12라우트 전부 200. SSR(ko) — `/pricing` 무료 베타 노출·기능비교/가격 미확정/Pro 전환/waitlist 0(Premium은 §13.2 법무 1회만 보존) · 헤더 LanguageSwitcher 0 · `/stock/034730` "AI 종합 분석" 0 · 내비 "베타 안내"·1차 "요금제" 0·`/history` 링크 0.
- **남은 갭(운영자/제품 게이트)**: 카카오 알림 실발송·앱스토어 제출·수익화 활성화·EN 토글 재개(코드/문자열/플래그 보존). 외부 사이트(Vercel) 반영은 별도 오너 단계.

### Task 113 — Free Beta v1 제품 방향 잠금 (결정 기록 + 공개 표면 감사 + 구현 매핑, docs 전용) (2026-06-30, Claude)
- **범위**: 추가 구현 전에 v1 방향을 고정하는 **결정-잠금**. 오너 결정 인코딩 — **무료(유료/곧유료 포지셔닝 금지) · 수익화는 내부 미래 옵션 · 카카오톡 알림 우선(이메일을 메인 알림 경로로 포지셔닝 안 함, 로그인 매직링크 이메일은 허용) · AI 분석 공개 우선 경험에서 숨김(코드 보존, 공개 진입점 제거/게이트) · 앱스토어 추후 목표(로드맵 유지·제출 작업 없음) · 영어 당분간 제외(한국어 전용 공개) · 138종목 유지 · 그 외 데이터 신뢰→탐색→모바일 우선**. **docs 전용 — `src/**` 무변경**(점수식·`stocks.json`·인증·manifest·PWA·i18n 무변경, 신규 npm 0, 매수/매도/추천 0).
- **신규 산출물**: `docs/ornscore-free-beta-v1-scope.md` — 결정 요약 + 오너 결정 원문 + **공개 표면 감사 표**(실측 `file:line` + 충돌 판정) + **구현 체크리스트 3분할**(must-change 공개 UI / keep-internal / future roadmap) + 수용 기준. 이 문서 1개만 읽으면 v1 범위 파악 가능.
- **감사 핵심 충돌(⚠️, 후속 공개 UI 대상)**: 요금제 1차 내비 `Sidebar.tsx:15`·`MobileBottomNav.tsx:21`(강등) / AI 카드 `stock/[ticker]/page.tsx:400`(공개 제거·게이트) / `/history` AI 기록 내비 `Sidebar.tsx:19`·`MobileBottomNav.tsx:20`(제거·게이트) / KO·EN 토글 `AppHeader.tsx:84`·`MobileNav.tsx`(숨김) / 이메일 메인 알림 톤 `alertCatalog.ts:85`·`settings/notifications/page.tsx:127-128`(카카오 로드맵 톤).
- **정합·보존(✅)**: 베타 카피 `copy/pricing.ts:204,225`(이미 보수화·정합) / 플랜 플래그 `features.ts:5,7,9,11,13`(내부 future) / AI 코드 `api/ai/analyze`·`lib/ai*`·`history/page.tsx`(보존) / EN i18n `i18n.ts`(보존) / 앱·스토어 `app-roadmap.md`·`app-packaging-*`·`app-store-submission-pack.md`+`manifest.ts`(로드맵 유지) / 138 문구 다수(정합).
- **의도적 이연**: 공개 UI 실변경은 **다음 작업** — 본 task는 결정 잠금 + 매핑만(플래너 한정: tiny/safe 외 `src/**` 무변경, 기본 0편집).
- **검증(docs 전용)**: `git diff --check` 0(CRLF 노이즈만) · 변경 파일(scope 신규·PROGRESS·AI_HANDOFF) U+FFFD/모지바케 0(Korean intact). `src/**` 무변경 → `tsc`/`build`/로컬 스모크 불요. **AI Center 4310 무중단**(로컬 서버 미기동).
- **남은 갭(후속·운영자)**: 구현 체크리스트 (i) 5건이 다음 우선. 카카오 알림 실발송·앱스토어 제출·수익화 활성화·EN 재개는 오너/제품 게이트.

### Task 112 — 최종 점검 QA 클로즈아웃 (P0/P1 회귀 재검증 + 잔여 P2 백테스트 히트맵 단위 1건 보강) (2026-06-30, Claude)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md` 전체 클로즈아웃. P0(task 108 기준일·109 필터)·P1(task 110 트러스트 카피) 회귀 0 재확인 + 잔여 P2 중 유일 미충족(백테스트 히트맵 단위 명시)만 보강. 표시/문구만(점수식·`stocks.json`·인증·manifest·PWA·정렬·`strength`/`direction` 무변경, 신규 npm 0, 매수/매도/추천 0). **변경 1파일** + docs.
- **유일 코드 변경** `src/components/backtest/MonthlyHeatmap.tsx`: 셀이 `(v*100).toFixed(0)`로 숫자만 표시되고 단위(%)가 `title`/`aria-label`에만 있어 텍스트 파싱 환경에서 안 보이던 갭(스펙 §6.5·P2-1) → 부제에 `각 칸의 숫자는 그 달의 수익률(%)` 한 절 추가. 셀/색/값 무변경.
- **재검증 통과(무변경)**: 기준일 06.29 전 페이지 일치·stale 06.26 0 / `/stocks` 123/138 헤드라인·토글·구 충돌문구 0 / `/watchlist` 빈상태 노출(로딩 고착 아님) / `/disclosures` `분류 신뢰도`·구 `신호 강도` 0 / `/pricing` `전환될 수 있`·`/status` `단계적으로 공개할 예정` / 업종 표본 `본인 포함`·`본인 제외` 0(task 102) / CTA grid 분리(task 91).
- **검증**: `tsc` 0 · `build` 0(138 SSG) · `git diff --check` 0 · 변경 1파일 U+FFFD 0. 로컬 prod **4421**(PID 17776만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 스모크 15라우트 전부 200, `/backtest` SSR 신규 단위 절 노출.
- **남은 갭(운영자)**: 390px 실 브라우저 육안(Playwright 미구성)·EN 파생 문구 잔여·`MonthlyHeatmap` 한국어 전용(i18n 도입 시 EN 단위 절)·스펙 P2-3 차트 접근성 요약·유료화 전 결제/환불/청약철회·AI 분석 삭제 정책·법무 전문 EN 번역은 운영자/제품 게이트.

### Task 110 — 최종 점검 P1 출시 전 신뢰 문구 마감 (관심 빈 상태 하드닝·순위 범위·요금제 베타·공시 강도→분류 신뢰도·상태 톤) (2026-06-30, Claude)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md` **§4 P1-1~P1-5**. P0(task 108 기준일·109 필터 문구)는 완료 상태. 표시/문구 + localStorage 방어 try/catch만(점수식·`stocks.json`·인증·manifest·PWA·`strength`/`direction` 데이터·정렬 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 8파일.
- **P1-5** `src/lib/copy/status.ts` `selfcheckFootnote`(ko+en): "…후속 과제입니다(현재는 배포 시점 스냅샷)" → "현재는 배포 시점 기준의 스냅샷 점검 결과를 제공하며, 점검 이력과 재수집 상태도 앞으로 단계적으로 공개할 예정입니다." 문자열 1쌍만, 시각/값 무변경.
- **P1-4** `src/lib/signalGuide.ts:54`(`insider_buy.cautionNote`) + `src/lib/copy/disclosures.ts` `cautionFallbackByType.insider_buy`(ko+en): 첫 노출어 `'강도'` → `'분류 신뢰도(자동분류 확신도)'`(호재 점수 아님·방향 DART 원문 확인 보존). + `disclosureExplorerCopy.periodScopeBadge`(ko "선택 기간 전체 아님 · 최신 200건 내" / en "Not the full period · within latest 200") 신설 → `DisclosureExplorer.tsx` 기간 버튼 행 끝 `within200` 동일 스타일 배지 렌더.
- **P1-2** `priorityScoreCardCopy.scopeNote(n)`(ko+en) 신설 → `PriorityScoreCard.tsx` 순위 줄 아래 동적 `poolN`(하드코딩 138 금지)로 "전체 N종목 기준 상대순위 · 홈 후보 순위와 다를 수 있음" 캡션. 홈 후보 배지(오늘 후보 순위·검증 보류 제외)는 Task 100서 이미 충족 — 검증만.
- **P1-3** `src/lib/copy/pricing.ts` `betaCard`(ko+en) "전환될 **예정**"→"전환될 **수 있습니다**", `compare.footer2b`(ko+en) "전환될 예정입니다"→"전환될 수 있고 전환 전 사전 안내합니다". 미확정 가격·사전 공지 보존, 가격값 0.
- **P1-1** `src/components/WatchlistClient.tsx` `view` 읽기/`changeView` 쓰기 try/catch 래핑(저장소 차단 graceful). 인터랙티브 빈 상태(아직 관심 종목 없음 + 검색 + `/stocks`·`/today` CTA + 로그인 동기화 CTA + 헤더의 브라우저저장 vs 로그인동기화 설명 + `<noscript>` fallback)는 이미 충족 — 검증만, loading→empty 전환 확인(로딩 텍스트 고착 아님).
- **검증**: `tsc` 0 · `build` 0(138 SSG) · `git diff --check` 0 · 변경 8파일 U+FFFD 0. `app:check` 생략(shell/nav/PWA/auth 무변경). 로컬 prod **4417**(PID 2496만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): 6라우트 200, SSR(ko) 신규 문구 렌더·구 문구(`후속 과제…스냅샷`·`전환될 예정`·`신호 강도`) 0건, EN 신규 키 청크 컴파일 확인.
- **의도적 범위**: `/status` 잔여 `후속 과제` 2건(`dataStatus.ts` 백테스트 생존편향·KRX 업종코드)은 '알려진 제한' 기술 고지로 P1-5 footnote와 다른 맥락 — 플래너 한정대로 무변경(운영자 후속 톤 조정 옵션).
- **남은 갭(운영자)**: 390px 실 브라우저 육안(Playwright 미구성)·EN 파생 문구 잔여·최종 점검 P2(히트맵 단위·업종 표본 일부 task 102 처리)는 별도 후속.

### Task 109 — 최종 점검 P0-2 `/stocks` 123/138 필터 문구 충돌 정리 (기본 품질 필터 ≠ 사용자 상세 필터 + 전체/기본 보기 토글) (2026-06-29, Claude)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md` **P0-2 종목 탐색 필터 문구 충돌**. 표시/문구만(점수식·`stocks.json`·`matchConfig.ts`·`savedSearches.ts`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 2파일(`src/lib/copy/stocks.ts`·`src/components/StocksExplorer.tsx`).
- **실 카운트**: 138종목 중 기본 품질 필터(PER≤200·PBR≤30, 0=결측 통과) 통과 **123 / 제외 15**. `sorted.length`·`total` 동적 — 하드코딩 0.
- **수정**: 카피에 `qualityHeadline`/`viewAllToggle`/`backToDefaultToggle`/`qualityRowOn·Off`/`detailRowLabel·None`/`sortRowLabel`/`backToDefaultReset`/`noMaxPlaceholder` 신설, `baseScreenNote`·`describeAll(shown<total)` 개정(기존 "전체 138개 보고 있다" 충돌 제거). 컴포넌트에 `NO_MAX=999999`·`qualityFilterOn`·`pureBrowse`·`viewAllStocks/backToDefaultView`·`sortOptionLabel()` 추가 → 헤더 카운트를 순수 기본 상태에서 `기본 품질 필터 적용 중: 123개 / 전체 138개`로 + 전체/기본 토글(flex-wrap·whitespace-nowrap 390px 가드), 현재 조건 단일 칩 줄을 **3행**(기본 품질/상세 필터/정렬)으로, PER/PBR 상한 입력 NO_MAX 가드, 빈 상태 보조 버튼 `전체 종목 보기`→`기본 화면으로 초기화`(138 약속 오인 제거). 저장/알림은 `perMax/pbrMax`가 state에 인코딩되어 NO_MAX 왕복·크론 일관(코드 추가 0).
- **검증**: `tsc` 0 · `build` 0(138 SSG) · `git diff --check` 0 · 변경 2파일 U+FFFD/모지바케 0. `app:check` 생략(shell/nav/PWA/auth 무변경). 로컬 prod **4399**(리스너 PID 37840만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING(PID 37328) 확인**): `/stocks` 200, SSR(ko) 신규 헤드라인·토글·3행·하단 문구 렌더·구 충돌 문구 0건, EN 신규 키 청크 컴파일 확인.
- **남은 갭(운영자)**: 390px 실 브라우저 육안(Playwright 미구성). 최종 점검 P1(관심 빈 상태·공시 강도 용어)·P2(히트맵 단위·업종 표본)는 별도 후속.

### Task 108 — 최종 점검 P0 데이터 기준일 페이지 일관성 (종목 상세 → 전역 스냅샷 A안 통일) (2026-06-29, Claude)
- **범위**: `ornscore_reaudit_2026-06-29_final_check.md`(데스크톱) **P0-1 페이지별 데이터 기준일 불일치**. 표시/문구만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 5파일.
- **유일 발산원**: `src/app/stock/[ticker]/page.tsx`의 `priceAsOf = lastPoint?.d`(per-stock 가격 시계열 마지막 거래일, raw `YYYY-MM-DD`)가 hero/`LivePrice`/`DataBasisCard`에 직접 들어가 전역 `formatBizDateLong(dataMetadata.asOfBusinessDate)`(`2026.06.29 (월)`)와 포맷·값이 어긋남. 나머지 라우트(헤더 데이터바·푸터·`/stocks`·`/status`·`/`·`/disclosures`·`/backtest`·`/pricing`·`/compare`·`/history`·`/guide/metrics`)는 이미 전역 스냅샷을 읽음. `/about`·`/watchlist`는 자체 기준일 없이 공통 헤더/푸터 상속(검증만).
- **수정(A안 + B안 방어)**: 종목 상세에서 `priceAsOf`를 `YYYYMMDD`로 정규화→전역과 비교(`priceLagsGlobal`). 정상이면 hero `asOfLabel`·`DataBasisCard` 주가 행·`LivePrice asOf` 모두 `globalAsOf`로 통일(값+포맷 전역 일치). 종목 주가가 실제 더 과거면 `priceLagAsOf`로 명시(`전체 서비스 기준 … · 이 종목 주가 … (최신 배치 미반영)`, ko/en `priceBasisLagCopy` 신설). **현재 데이터는 138종목 모두 가격 마지막 점 `2026-06-29` → 전 종목 정상 분기**, 지연 안내는 미래 시점차 방어용.
- **검증**: `tsc` 0 · `build` 0(138 SSG) · `git diff --check` 0 · 변경 5파일 U+FFFD 0. `app:check` 생략(shell/nav/PWA/auth 무변경). 로컬 prod 4399(내 PID 34960만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING 확인**): `/stock/034730·005930·000660`·`/stocks`·`/watchlist`·`/about`·`/status`·`/` 200, 전 라우트 SSR(ko) `2026.06.29 (월)` 일치·사용자 노출 `2026.06.26` 0건(상세 HTML의 `2026-06-26`은 가격 차트 시계열·차트 x축 범위·JSON-LD ISO뿐, 기준일 아님).
- **남은 갭(운영자)**: ISR/배포 캐시 — `revalidate` 라우트가 레이아웃 데이터바 날짜를 독립 캐시 → **데이터 갱신 후 전체 재배포가 stale 날짜 flush하는 운영 단계**(코드 아님). 시크릿/강력 새로고침 동일성은 재배포 후 운영자 확인. 최종 점검 P0-2(`/stocks` 123/138 필터 문구)·P1/P2는 별도 후속.

### Task 102 — 재검수 P2 정적 텍스트·접근성·신뢰 문구 (배지 분리·STEP ol>li·업종 카운트·공시 CTA/배지·백테스트 단위/날짜·밸류 경고) (2026-06-29, Claude)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱) **P2-1~P2-6**(§6) + §7.3/7.4/7.5/7.12. 카피/마크업/스타일만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0, 매수/매도/추천 0). 변경 6파일.
- **P2-1** `stock/PriorityScoreCard.tsx`: 데이터 배지 3종 사이 `<span class="sr-only"> · </span>` → 정적/스크린리더 `필수 데이터 100% · 이상값 점검 통과 · Metrics 2.4`(글루 해소). role=list·suspect 분기·whitespace-nowrap 보존.
- **P2-2** `BeginnerReading.tsx`: STEP `div.grid` → `<ol class="… list-none p-0 m-0">` + 각 `StepCard` `<li class="h-full">` 래핑(key→li). STEP n 배지가 가시 번호 단일 소스. href·순서 보존.
- **P2-3** `DisclosureExplorer.tsx`: `notInUniverse` 배지를 액션 행 밖 별도 `<div class="mt-1.5 …">`로 분리(원문 보기 버튼과 DOM·시각·텍스트 추출 분리). `strength` 숫자 카드 미렌더 + `signalGuide.ts:54`가 "강도=분류 신뢰도, 호재 점수 아님" 이미 명시 → 추가 라벨 불필요(검증만).
- **P2-4/5** `BacktestClient.tsx`: 상단 KPI 위 amber 배지 `백테스트 기준: {yyyy-mm-dd} 생성 · 현재 데이터 {siteDataAsOf}과 다름`(신규 `formatGeneratedDate`, siteDataAsOf 없으면 생성일만). 마지막 리밸런싱 제목에 `현재 추천 아님` amber 배지. 히트맵 `title`+`aria-label`(%) 이미 충족(검증만).
- **P2-6** `copy/stockDetail.ts` `metricInsightCardsCopy.valueNote` ko/en 강화(업종 보정 전 전체 풀·금융/지주 구조적 고평가 주의·아래 업종 대비 밸류 참고) + `stock/MetricInsightCards.tsx` 밸류 노트 cyan→amber 박스. 138 하드코딩 안 함.
- **P1-7(동시 처리)** `copy/stockDetail.ts` `sectorValue.peerDescMid` ko "개(본인 제외)"→**"곳(본인 포함)"**, en "(excluding this stock)"→"(this stock included)". `sectorValueScore.peers`가 per/pbr>0 필터로 **본인 포함** → 실제 계산·`SectorComparison`("본인 포함")과 통일. 스모크: 034730 두 카드 `7곳`, 032830 두 카드 `15곳` 일치. (플래너의 "현재 종목 제외"는 계산과 모순 → 정확성 우선으로 "본인 포함" 채택.)
- **검증**: `tsc --noEmit` 0 · `build` 0(138 SSG) · `verify_metrics.py` 0오류·금칙어 0·Metrics 2.4 · `git diff --check` 0 · U+FFFD 0. `app:check` 생략(PWA/auth/shell 무변경). prod **47102**(내 PID 31520만 종료·4310 무중단): 5라우트 200, SSR(ko) 신규 문구·sr-only 분리자·ol/li STEP·백테스트 배지 노출, EN 청크 패리티(`(this stock included)`·`before sector adjustment`).
- **남은 갭(후속)**: P2-3 `notInUniverse` 카드 배지는 현재 SSR 샘플에 비유니버스 공시 카드가 없어 화면 미노출(구조만 분리). SEO 메타/OG·도메인 이메일·모바일 실기기 육안·`/en` URL은 운영자 게이트(범위 외).

### Task 101 — 재검수 P1/P2 상용 준비 페이지 문구 명료화 (요금제·로그인·히스토리·개인정보) (2026-06-29, Claude)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱) **P1-5·P1-8·7.7·7.11·7.14** 커버. 텍스트 카피 + 위탁사 링크만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0). 보수적·비자문(매수/매도/추천 0).
- **P1-5 요금제 비교표 값 중심화** — `src/lib/pricing.ts` `COMPARE_ROWS`: 관심 종목 pro/premium `true/준비 중` → **`무제한 예정`**, 종목 비교 → **`확장 예정`**, 공시 알림 pro/premium `true`(✓) → **`포함 예정`**(메세지 명확화). free 한도(`5개`/`4개`/`베타 무료`)·점수 급변 줄(free `—` 미제공·pro/premium 준비 중)·진짜 준비 중 행 무변경. `src/lib/copy/pricing.ts` `classifyKoCell`: "…예정"으로 끝나는 셀 → `planned`(amber) 동일 표시; `enCellText`: 무제한/확장/포함 예정 → `Unlimited/Expanded/Included (planned)`(EN 한국어 누출 차단). 범례(제공/미제공/준비 중/베타 무료) 모순 없음(예정=planned=준비 중 스타일).
- **요금제 7.7 데이터 수집 고지** — `copy/pricing.ts` ko/en `waitlistDataNote` 추가("입력한 이메일은 출시 알림 발송 목적으로만 수집·보관…수신 거부 시 파기"), `PricingContent.tsx` `<WaitlistForm>` 아래 muted `<p>`로 렌더. privacy §3 waitlist 보존정책과 정합.
- **P1-8 로그인 과장 완화** — `src/lib/i18n.ts` `loginCopy.ko.lead` "…로 1초 만에 시작" → **"…로 빠르게 시작"**. EN lead(`Start with …`)는 이미 보수적 → 무변경. **소셜 실패 + 매직링크 fallback 카피는 이미 완비 — 검증만**: `login/page.tsx` `friendlyAuthError`(noCode/callback/provider/rateLimit/invalidEmail/unknown) + 이메일 "보냈어요"·스팸함 힌트. 재구축 안 함.
- **7.11 히스토리 저장 항목 명시** — `src/app/history/page.tsx` 비로그인 헤더 + 로그인 서브헤더 양쪽에 "저장 항목: 분석한 종목 · 질문 · AI 응답 · 작성 메모." 한 줄(privacy §1/§3와 정합, 과대 저장 주장 없음). 한국어 전용(파일 기존 패턴).
- **7.14 privacy 위탁사 링크 + 날짜** — `src/app/privacy/page.tsx` §5 각 위탁사(Supabase·Vercel·Resend·Anthropic·Kakao·Google·Naver)에 공식 처리방침 링크 추가(`target=_blank rel=noopener noreferrer`, 안정 공식 URL). "최종 갱신: 2026년 6월" → **"2026-06-29"**(문서 내용 변경됨). **도메인 이메일(privacy@/support@) 발명 안 함** — `songchankeun@gmail.com` 유지, 도메인 이메일은 docs 미래 노트만(공개 약속 0).
- **이미 됨(재작업 안 함)**: P1-1 `/terms` 내부 문서 경로(`docs/legal-ai-commercial-readiness.md`)는 Task 99에서 제거 완료 — `src/**/*.tsx` grep 0건 재확인. terms 내용 무변경 → 갱신일 그대로. 로그인 실패/fallback 카피도 기구현 → 검증만.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0(CRLF 경고만) · 변경 파일 U+FFFD 0. 로컬 prod **4399**(내 PID 35952만 종료·**AI Center 4310 무중단·종료 후 4310 LISTENING 확인**): `/pricing`·`/login`·`/history`·`/privacy`·`/terms` 200. SSR(ko) 노출 — 요금제 `무제한 예정`·`확장 예정`·`포함 예정`·waitlist 고지, `/history` 저장 항목, `/login` `빠르게 시작`(`1초 만에` 0), `/privacy` 위탁사 링크+`2026-06-29`. EN은 클라 전환이라 빌드 청크에서 `Unlimited/Expanded/Included (planned)`·waitlist EN 컴파일 확인.
- **남은 갭(후속)**: 재검수 P2(배지 띄어쓰기·STEP `ol>li`·공시 CTA/배지 DOM 분리·백테스트 히트맵 단위/aria·밸류 업종 미보정 경고)·P1-7(상세 업종 카운트 본인 포함/제외 통일). **도메인 support@/privacy@ 이메일 미구성** — 운영자 결정 대기(공개 약속 안 함, docs 노트만).

### Task 99 — 재검수 P0 신뢰 문구 3건 (stocks 카운트·status 시간대·terms 내부경로) (2026-06-29, Claude)
- **범위**: `ornscore_reaudit_2026-06-29.md`(데스크톱)의 **즉시 수정 P0 3건**. P1/P2는 후속. 텍스트 전용 변경(6파일), 점수식·`stocks.json`·인증·manifest·PWA 무변경. 신규 npm 0.
- **P0-1 `/stocks` 카운트·필터 충돌(안 A)** — `src/lib/copy/stocks.ts`(ko/en): `matchCount`·`matchCountShort` "조건 충족"→**"현재 표시"**(en "Showing"). `noDetailFilter`→**"적용된 사용자 상세 필터 없음"**(en "No user detail filters applied"). `describeAll(total)`→**`describeAll(shown,total)`** 분기(`shown<total`→"기본 품질 필터(PER 200·PBR 30 이하)가 적용된 N개 …", else 기존 전체 문구). `StocksExplorer.tsx` 호출 1곳 `t.describeAll(sorted.length, total)`. 기본 123/138에서 "전체 138개 보고 있다" 충돌 제거. 제외 사유 문구(`baseScreenNote`) PER/PBR 정확 유지, 검증보류 주장 추가 안 함.
- **P0-2 `/status` 점수 계산 시각 시간대** — `src/app/status/page.tsx` `formatScoreTimes()`로 `generatedAt`(GitHub Actions UTC naive ISO)을 **KST(+9h)·UTC** 두 표기 산출(정규식+`Date.UTC`, 의존성 0). `StatusContent.tsx` 스냅샷 셀: `{scoreTimeKst} KST` 우선 + `(장마감 후 배치)` + `원본 배치 {scoreTimeUtc} UTC` + carry-forward 노트. `copy/status.ts`(ko/en) `scoreTimeBatchNote`·`scoreTimeUtcLabel`·`dataCadenceNote` 추가. 10:44 UTC→19:44 KST(스펙 일치).
- **P0-3 `/terms` 내부 경로 제거** — `src/app/terms/page.tsx` `docs/legal-ai-commercial-readiness.md` 추적 문장 삭제 → "가격과 유료 정책은 현재 미확정이며, 유료 결제 오픈 전 약관과 결제 화면에 동일하게 확정 공지합니다(요금제 안내)."로 교체. `/pricing` 링크 보존. src 잔여 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0(6파일) · U+FFFD 0. 로컬 prod **3199**(내 PID만 종료·**AI Center 무중단**): `/`·`/stocks`·`/status`·`/terms`·`/stock/005930` 200. ko SSR에 신규 문구 노출·구 충돌 문구 0건, `/terms` 내부 경로 0건. EN은 클라 전환이라 빌드 청크에서 신규 EN 문자열 컴파일 확인.
- **남은 갭(후속)**: 재검수 P1(공시 50/42 라벨·홈↔상세 순위 기준 분리·`/watchlist`·`/compare` 빈 상태·요금제 표·업종 카운트·배지 띄어쓰기)·P2(STEP `ol>li`·공시 CTA/배지 DOM 분리·백테스트 히트맵 단위/aria·밸류 업종 미보정 경고 강화).
- **다음**: 운영자/제품 — P1 빈 상태(관심/비교) 보강(스펙 §10 최종판단 4순위), 이어서 홈/상세 순위 기준 분리.

### Task 100 — 재검수 P1 출시 전 UX (카운트 맥락·순위 기준·빈/실패 상태) (2026-06-29, Claude)
- **범위**: `ornscore_reaudit_2026-06-29.md` **P1-2·P1-3·P1-4·P1-6** 4건. 텍스트 카피 + `<noscript>` fallback만(점수식·`stocks.json`·인증·manifest·PWA 무변경, 신규 npm 0). 보수적·비자문 유지(매수/매도/추천 0).
- **P1-2 홈 공시 카운트 맥락(라벨링)** — 기저 정합은 Task 99 시기 이미 정리됨(홈 `signalCount`=`recentSig.signalCount` 최신 200건 내 raw 신호, `/disclosures`는 `최신 200건 내 신호 N건 · 이벤트 묶음 M개`로 명시). 남은 위험 = 홈 스냅샷 카드의 맨숫자(예 "50건")가 공시 페이지 "42(묶음)"와 충돌처럼 읽힘. `src/lib/copy/home.ts` 스냅샷 signal `sub` ko `"DART · 최신 200건 내"`→**`"DART · 최신 200건 내 · 신호 기준"`**, en `"… within latest 200"`→**`"… · signal basis"`**. 숫자 로직 무변경.
- **P1-6 홈 후보 순위 vs 상세 전체 상대순위** — 상세는 이미 라벨 양호("전체 상대순위 N위"). 홈만 카피로 명료화: `home.ts` `topCandidate`에 `rankCriteria`(ko/en) + `rankBadgeAria(n)` 추가. `TopCandidateSection.tsx`에 intro 아래 캡션으로 렌더("여기 번호는 오늘 후보 목록(검증 보류 제외) 안의 표시 순서…상세의 전체 상대순위(전체 138종목 기준)와 의미 다를 수 있음"). `StockCandidateCard.tsx` 순위 배지에 `title`/`aria-label`="오늘 후보 순위 N위". **홈 카드에 전체 풀 순위 숫자 계산/표시는 하지 않음**(새 숫자 로직·노이즈 회피, 캡션으로 충분).
- **P1-3 `/watchlist` 정적/실패 fallback** — 인터랙티브 빈 상태(`WatchlistClient` "아직 관심 종목이 없습니다"+검색+CTA)는 이미 양호(검증·보존). 실제 갭 = SSR/no-JS 시 `loading` 분기만 보여 "불러오는 중..."에 고착. `src/app/watchlist/page.tsx` `<WatchlistClient/>` 아래 **`<noscript>` fallback** 추가(빈 상태 카피 + `종목 찾기`→`/stocks`·`오늘 후보 보기`→`/today` 평문 `<a>`, 로그인 동기화는 보조 문구). `WatchlistClient.tsx` `loading` 분기에 보조 한 줄 추가(빈 스피너 방지), 기존 `loadError` "다시 시도" 보존.
- **P1-4 `/compare` 빈 상태·CTA·한도** — 인터랙티브 빈 상태(`CompareClient` in-page 검색·추천 세트·최근/Top5/관심 빠른추가·`최소 2개·최대 4개` 한도)는 이미 충족(검증·보존). 갭 = `!mounted`일 때 `return null`(line 185) → SSR/no-JS 헤더 아래 빈 화면. `src/app/compare/page.tsx` `<CompareClient/>` 아래 **`<noscript>` fallback** 추가("비교할 종목이 아직 없습니다" + `최소 2개·최대 4개` 한도 + `종목 찾기`→`/stocks`·`오늘 후보에서 고르기`→`/today` 평문 `<a>`).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `git diff --check` 0(6파일) · 변경 파일 U+FFFD 0. **`app:check` 생략**(PWA/auth/shell 무변경 — 카피+noscript만). 로컬 prod **47100**(내 PID 1754만 종료·**AI Center 4310 무중단·종료 후 4310 200 확인**): `/`·`/disclosures`·`/watchlist`·`/compare`·`/stock/034730` 200. SSR(ko) 노출 확인 — 홈 `신호 기준`·`오늘 후보 목록(검증 보류 제외)`·`전체 상대순위(전체 138종목 기준)`·`오늘 후보 순위 1~5위`, `/watchlist` noscript(아직 관심 종목이 없습니다·종목 찾기·오늘 후보 보기·여러 기기 동기화 보조), `/compare` noscript(비교할 종목이 아직 없습니다·최소 2개·최대 4개·종목 찾기·오늘 후보에서 고르기). EN은 클라 전환이라 빌드 청크에서 신규 EN 문자열 컴파일 확인.
- **이미 됨(재작업 안 함)**: 인터랙티브 빈 상태(관심/비교) 모두 충족 — 검증만. 기저 50/42 카운트 정합/라벨도 Task 99 시기 완료 — 홈 라벨만 보강.
- **남은 갭(후속)**: 재검수 P1-1(약관 내부 경로—Task 99서 처리)·P1-5(요금제 표 값 중심)·P1-7(상세 업종 카운트 본인 포함/제외 통일)·P1-8(로그인 "1초" 과장)·P2(배지 띄어쓰기·백테스트 히트맵 단위/aria·STEP `ol>li`).

### Task 93 — 3차 QA P1 감사 + Pro 관심 종목 공시 수집 설계 노트 (2026-06-28, Claude)
- **범위/판단**: `ORNSCORE_3rd_QA_improvement_spec.md` P0(상세·비교) 이후 **P1 명료성 5항(공시 필터·탐색 밀도·요금제 베타 고지·공시 200건 한계·AI 고지)**. 현황 전수 점검 → **5개 P1 모두 이미 배포 확인**(Task 60/61/62/66/89~94). 작동 컴포넌트 재작업 금지, 감사 + **유일 신규 산출물 = P1-4(§10) 공시 수집 설계 노트**. 소스 코드 무변경(문서 3종만).
- **감사 결과(읽기 전용·무변경)**:
  - **P1-1**: `DisclosureExplorer.tsx` 범위 토글 = 세그먼트 버튼 그룹(`role=group`·`aria-pressed`·선택 blue-600+ring·카운트 배지) + 설명 한 줄 + "최신 200건 내" 배지. `copy/disclosures.ts` ko/en 완비. ✅
  - **P1-2**: `StocksExplorer.tsx` 첫 화면 = 검색 → 질문형 프리셋 카드(예상 결과 수) → 빠른 프리셋 칩(기본 접힘) → 정렬/상세 필터 drawer. 유용 필터 보존. ✅
  - **P1-3**: `PricingContent.tsx`+`copy/pricing.ts` sky `betaCard` = 베타 무료 알림 → 정식 출시 시 Pro 전환 예정·시점/가격 미확정·**변경 전 미리 공지**. 확정 유료 가격 0. ✅
  - **P1-5**: `AiAnalysisCard.tsx`+`aiAnalysisCardCopy` = 실행 전 고지(데이터→Anthropic 미국·민감정보 금지·참고용) + **필수 동의 체크박스 게이팅** + 결과 상단 면책 + 푸터/하단 비자문. `privacy/page.tsx`(Anthropic 미국·국외이전 표·학습 미사용)와 정합. ko/en 완비. ✅
- **신규 산출물(P1-4)**: `docs/ornscore-beta-launch-checklist.md` **(g) 공시 수집 범위 설계 노트** — (g-1) 현재 최신 200건 제한 고지 표면 정리 / (g-2) 알림이 일반 200건 피드 의존 금지 이유(누락·커버리지 미보장·신뢰성) / (g-3) 권장 설계(기존 `listDisclosuresByStock` 종목 단위 조회 재사용 + 영속 커서 `watched_disclosure_cursor` 델타 + cron 배치·rate limit + 탐색 피드 분리) / (g-4) 범위 경계(설계만·파이프라인/스키마/cron=대기④). `ornscore-spec-coverage.md` line 52에 교차 참조.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `git diff --check` 0 · 변경 문서 U+FFFD 0. 신규 금칙어 0. **소스 무변경 → `app:check`·로컬 prod 스모크 불요**(app-facing 소스 무변경).
- **남은 갭(후속)**: ④ 공시 전체 기간 수집 파이프라인 + 관심 종목 알림 라이브(g-3 구현)·관리자 상태판·결제/법무 확정·실브라우저 390px 육안(운영자 Playwright 게이트).
- **다음**: 운영자/제품 — 알림 라이브 결정 시 (g-3)대로 종목 단위 수집 + 영속 커서 착수, 또는 spec §19.2 전체 기간 수집 파이프라인.

### Task 94 — 모바일 드로어/로그인 레이아웃 수리 (헤더 backdrop-filter 컨테이닝 블록 탈출) (2026-06-28, Claude)
- **증상(운영자 스크린샷)**: 모바일에서 햄버거 메뉴를 열면 드로어가 화면 전체를 덮는 깔끔한 오버레이가 아니라 헤더 영역 안에 갇힌 좁은 좌측 패널처럼 보이고, 백드롭이 페이지를 완전히 가리지 못해 글로벌 데이터바·KO/EN·테마·로그인 카드가 드로어와 겹쳐/충돌해 보임.
- **근본 원인**: `AppHeader`의 `<header>`가 `backdrop-blur-md`(=`backdrop-filter`)를 가져 **고정 위치 자손의 컨테이닝 블록**이 됨. `MobileNav`이 그 헤더 안에서 렌더되므로 드로어/백드롭의 `fixed inset-0`/`inset-y-0`가 뷰포트가 아니라 **짧은 헤더 바 기준으로 크기/위치가 잡혀** 클리핑·겹침 발생. (CSS: transform/filter/backdrop-filter 가진 조상은 fixed 자손의 컨테이닝 블록이 된다.)
- **수정(`src/components/MobileNav.tsx` 1파일)**: 드로어+백드롭을 `react-dom`의 `createPortal(<>…</>, document.body)`로 **헤더 밖 body 직속**으로 포털해 컨테이닝 블록 트랩 탈출. SSR 하이드레이션 안전을 위해 `mounted` 가드(`useEffect(()=>setMounted(true),[])`) 추가 — 마운트 전엔 오버레이 미렌더. **드로어 폭** `w-[300px] max-w-[85vw]` → `w-[min(340px,calc(100vw-48px))]`(예측 가능, 360–390px에서 우측 여백 48px 보장). 푸터 테마/언어 행을 `flex-wrap gap-2`로 하드닝(좁은 폭에서 라벨+`LanguageSwitcher`+`ThemeToggle` 줄바꿈, 클리핑 방지). **기존 동작 전부 보존**: body 스크롤 락·Escape 닫기·라우트 변경 자동 닫기·`loginNext` `safeInternalPath`·로그아웃·`flex-1 overflow-y-auto`(내부 스크롤)·`shrink-0` 푸터. `z-[60]`(백드롭)/`z-[61]`(드로어)는 이제 body 직속이라 헤더(z-40)·하단 탭(z-40) 위에 전역으로 뜸.
- **무변경(검증만)**: `LanguageSwitcher.tsx`·`ThemeToggle.tsx`(wrap 후 클리핑 없음) · `src/app/login/page.tsx`(포털 백드롭이 로그인 카드/소셜/이메일 폼을 완전히 덮음 — mix-through 없음, 360px 오버플로 없음) · `HeaderDataBar`/`MobileBottomNav`(z-40 유지, 포털 드로어가 위에 옴).
- **검증**: `npx tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG, 전 라우트) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0 · `MobileNav.tsx` U+FFFD 0. 로컬 prod **3500**(내 PID만 taskkill·**AI Center 4310 무중단·200 확인**): `/login`·`/`·`/stocks`·`/stock/005380` 200, 클라 청크에 새 드로어 폭 토큰(`min(340px,calc(100vw-48px))`)·`explorationNotice` 컴파일 확인.
- **남은 UI 리스크(후속)**: (1) 실기기 390px 모바일 육안(드로어 열림 시 데이터바/로그인 겹침 최종 확인)은 운영자 게이트(Playwright 미구성) — 코드상 포털·폭·wrap·스크롤은 보존. (2) 사용 안 하는 `src/components/MobileMenu.tsx`(데드 코드)는 이번 범위 밖으로 무변경 — 추후 정리 후보. (3) `ThemeToggle` compact 탭타깃 36px(w-9 h-9)은 기존값 유지(범위 밖, 클리핑 없음).
- **다음**: Task 93 — P1 공시/가격/AI 고지 정리.

### Task 92 — 3차 QA P0-B 비교 페이지 시작 화면 마감 (큐레이션 vs-쌍 추천 + 390px 디클러터) (2026-06-28, Claude)
- **범위/판단**: `ORNSCORE_3rd_QA_improvement_spec.md` P0-B = `/compare` 빈 상태를 "완성된 비교 시작 화면"으로. 먼저 현황 점검 → 직전 작업으로 **검색·선택 칩(× 제거)·추천 세트·최근 본·오늘 Top5·관심·업종 탐색이 이미 구현돼 있음** 확인. 따라서 전면 재작업 대신 spec이 콕 집은 두 갭만 메움: (1) 추천 세트를 **의미 있는 "A vs B" 동종 피어 쌍**으로 업그레이드, (2) **390px 카드-속-카드 디클러터**.
- **수정 파일 2개**:
  - `src/app/compare/page.tsx` — `recommendedSets` 생성 로직 교체. 큐레이션 피어 쌍 4개 후보(삼성전자005930 vs SK하이닉스000660 · 삼성생명032830 vs 미래에셋생명085620 · DB하이텍000990 vs 한미반도체042700 · 에코프로비엠247540 vs 엘앤에프066970)를 `byTicker`로 검증 — **두 종목 모두 풀에 존재 & `isSuspect` 아님**일 때만 `label:"A vs B"`로 노출. 에코프로비엠(PER≥300)·엘앤에프(ROE≥80)는 둘 다 검증 보류 → **자동 제외**(3쌍 생존). 그 뒤 기존 같은-업종 그룹을 **큐레이션이 커버한 업종(반도체·보험) 제외**(dedup) 후 보충, **총 4세트로 슬라이스**(스캔 가능). 결과: 3 큐레이션 쌍 + `2차전지·소재` 업종 1개.
  - `src/components/CompareClient.tsx` — `stocks.length < 2` 시작 화면만 디클러터: 히어로 축소(emoji `text-2xl`·여백 축소), 외곽 패딩 `p-6 md:p-10`→`p-4 md:p-8`, **최근 본/오늘 Top5/관심을 각각 테두리 박스에서 가벼운 라벨 그룹(`space-y-3.5`)으로** 합쳐 6박스 적층 → 검색(유일 강조 박스)+칩 그룹으로 정리. 추천 버튼은 `label`에 `" vs "` 있으면 names 서브타이틀 생략(중복 제거). 모든 어포던스 보존(검색·선택 칩+`aria-label` × 제거·추천 쌍·최근·Top5·로그아웃 관심 안내+`/watchlist`·`/stocks` 탐색), 빠른추가 칩 터치타깃 `min-h-[44px]` 통일·`flex-wrap` 유지. `addToCompare`/`removeFromCompare`/`clearCompare`/`addSet`/결과 뷰 **무변경**.
- **금융 문구**: 보수적·비자문 유지(매수/매도/추천/수익보장 0). 검증: `verify_metrics` 금칙어 0.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG) · `verify_metrics.py`(PYTHONUTF8) 138/0·금칙어 0·**Metrics 2.4** · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0 · 변경 파일 U+FFFD 0. 로컬 prod **3500**(내 PID만 taskkill·**AI Center 4310 무중단**): `/compare` 200, flight 페이로드에 큐레이션 라벨 3종(`삼성전자 vs SK하이닉스`·`삼성생명 vs 미래에셋생명`·`DB하이텍 vs 한미반도체`) + 보충 `2차전지·소재` 확인, 검증 보류 쌍(에코프로비엠 vs 엘앤에프) 미노출 확인.
- **남은 갭(후속)**: (1) `/compare`는 **한국어 전용** — 언어 전환이 이 페이지를 마운트하지 않아 i18n 미적용(EN 잔여, 스코프 밖). (2) 실브라우저 390px 모바일 육안은 운영자 게이트(Playwright 미구성) — 코드상 터치타깃·wrap·스크롤은 보존. (3) 추천 쌍은 정적 큐레이션 — 데이터 변동 시 suspect 자동 제외만 동작, 쌍 후보 자체는 수동 관리.
- **다음**: P1 항목 — 공시 전체 시장/분석 대상 토글, 종목 탐색(`/stocks`) 첫 화면 밀도/우선순위 정리.

### Task 91 — 3차 QA P0-A 종목 상세 UI 마감 (CTA·STEP·배지 분리 검증 + 잔여 행동 문구 중립화) (2026-06-28, Claude)
- **범위/판단**: `ORNSCORE_3rd_QA_improvement_spec.md`(데스크톱 상위 폴더) PART A의 **P0-A = 종목 상세 마감**만. 먼저 현황을 점검 → spec이 지적한 (1) CTA 버튼 글루 (2) 초보자 STEP 한 줄 글루 (3) 데이터 품질 배지 글루는 **이미 분리 컴포넌트로 구현돼 있음**을 코드·SSR로 확인. 따라서 재작업하지 않고 검증 + 실제로 남아 있던 (4) 행동성 문구만 중립화.
- **검증된 분리 컴포넌트(무변경)**: `src/components/stock/StockDetailActionButtons.tsx`(grid `grid-cols-1 min-[380px]:grid-cols-2 xl:grid-cols-4`·독립 `<a>`·`min-h-[44px]`·gap·아이콘+라벨·border/shadow — 모바일 2열·데스크톱 4열 자연 줄바꿈) / `src/components/BeginnerReading.tsx`의 `StepCard`(grid `grid-cols-1 md:grid-cols-3`·STEP 라벨 배지+제목+설명 분리 카드 3개·모바일 세로) / `src/components/stock/PriorityScoreCard.tsx`의 `DataStatusPill`(flex-wrap·gap·독립 pill 3종: `필수 데이터 N%`·`이상값 점검 통과`(또는 검증 보류)·`Metrics 2.4`).
- **수정(1파일·2줄)**: `src/lib/metricReadings.ts` — 위험조정 <40 action `"출렁임 감내 가능한 비중으로 접근 권장"`(행동 권유 "접근 권장"+"비중") → `"변동 폭이 큰 구간 — 실제 일간 변동·최대낙폭과 본인 감내 범위를 함께 확인"`; 거래활성도 <40 action `"… 회복 신호 기다리기"` → `"… 거래량 회복 신호가 나오는지 확인"`. spec §7 핵심 예시(`하락 추세 … 저가 매수일지 …`)는 직전 배포에서 이미 `"… 반등 근거와 추가 하락 위험을 함께 확인"`으로 선반영 → 무변경. 점수 산식·`Reading` 타입·이모지·임계값 불변. 잔존 "매수/매도"는 모두 비자문 고지·DART 사실 방향 라벨이라 유지가 맞음(grep 전수 확인).
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(138 종목 SSG) · `verify_metrics.py`(PYTHONUTF8) 138/0·금칙어 0·**Metrics 2.4** · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0 · 변경 파일 U+FFFD 0. 로컬 prod **3500**(내 PID만 taskkill·**AI Center 4310 무중단**): `/stock/005380·005930·032830` 200, SSR에 글루 텍스트(`공시 확인재무 보기`·`100%이상값`) 0 / CTA 4개 분리 href / STEP 3 카드 / 배지 3종 분리 / 중립 문구 페이지 청크 컴파일 확인.
- **남은 갭(후속)**: (1) **P0-4 비교 페이지 빈 상태**(검색·추천 비교 세트·최근 본/관심 종목 추가 UI) 미완 = 다음 1순위. (2) `metricReadings`·`conclusion`·`scoreBasis`·`signalGuide` 파생 문구 EN 로케일에서 한국어(i18n 잔여). (3) 실브라우저 390px 모바일 육안은 운영자 게이트(Playwright 미구성).
- **다음**: P0-4 비교 페이지 "비교 시작 화면" 마감(종목 검색 + 추천 세트 + 최근/관심 추가 + 칩 제거, 2종목 선택 전에도 완성도).

### Task 90 후속 수리 — 로그인 링크 hydration mismatch 제거 (Playwright 게이트 수복) (2026-06-28, Claude)
- **증상**: Playwright 품질게이트 데스크톱·모바일 모두 실패. `AccountButtons`의 로그인 `href` 서버/클라 불일치 — 서버 `/login?next=%2Fstock%2F005380`, 클라 `/login?next=%2Fstock%2F005380%3Flang%3Den`(`?lang=en` 차이). 렌더 중 `window.location.search`를 직접 읽어 SSR엔 없고 클라 hydration엔 있어 React `did not match` 경고.
- **수정**: `src/components/AccountButtons.tsx` — search를 렌더 중이 아닌 `useState("")`+`useEffect`(pathname 의존)로 **마운트 후에만** 채움. 초기 렌더가 SSR과 동일(빈 search)해 mismatch 제거. 복귀 next 쿼리는 hydration 후 반영, 인증·동작 무변경.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0 · `npm run app:check` 통과 · `git diff --check` 0 · U+FFFD 0. (Task 87 repair 2의 Pretendard hydration 수복과 동일 패턴.)

### 영어 지원 QA + 홈 화면 다국어화 + 모바일 점검 (2026-06-28, Claude · task 90)
- **범위/판단**: task 89(영어 v2) 후속 QA. 먼저 결과를 점검 → task 89가 `/stocks`·`/stock/[ticker]`·`/today`·`/disclosures`·`/pricing`·`/status`·`/guide/metrics`·`/terms`·`/privacy`를 충실히 영어화했고 모바일 하드닝도 이미 양호함을 확인. 재번역 대신 **최대 임팩트 갭 = 홈(/) 히어로 아래 전 구간이 EN 모드에서도 한국어**를 우선 처리.
- **홈 다국어화**: 신규 `src/lib/copy/home.ts`(ko/en 단일 출처). 홈 카드 서버 컴포넌트를 `"use client"`+`useLanguage`로 전환 — `MarketSnapshotCards`·`FeatureCards`·`HowItWorksSection`·`TopCandidateSection`·`StockCandidateCard`·`DisclosureSignalSection`·`DisclosureSignalCard` + 신규 `HomeDataSourceFooter`. `HomeHero`·`TodayContent`의 후보 칩도 신규 구조에 맞춤.
- **데이터 무변경**: `page.tsx`는 점수·필터 유지. 강점 칩 `metrics: string[]`→`StrongMetric[]`(key+값), 주의 문구 서버 문자열→`riskKind`(원시 점수 분기만)로 바꿔 문장은 클라에서 현지화. `stocks.json`·점수식·`direction` 불변. 종목명·업종·공시 원문(corpName/reportNm/signalLabel)·숫자는 한국어 원형 유지(스코프 허용).
- **법무**: `LegalEnSummary`가 `/terms`·`/privacy` EN 상단에 영어 요약 + `LEGAL_EN_PENDING_NOTE`("full English legal translation is pending owner/legal review")를 렌더하고 한국어 본문 정본을 보존함을 확인 — 추가 수정 불필요. **전문 영어 법무 번역은 운영자/법무 검토 잔여.**
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(176p SSG) · `npm run app:check` 통과(외부 게이트 1: assetlinks 대기-기존) · `git diff --check` 0(CRLF만) · 변경/신규 12파일 U+FFFD 0. 로컬 prod **3500**(내 PID만 종료·**AI Center 4310 무중단**): 11라우트 200, KO SSR 홈 한국어 기본(회귀 0), EN 홈 카피 클라 청크 컴파일 확인, `/login` 4제공자(네이버 "설정 필요" 비활성) KO/EN 렌더(인증 동작 무변경).
- **남은 갭(후속)**: (1) 종목 상세 라이브러리 파생 문구 EN 한국어(`conclusion`·`composeReasonV2`·`metricReadings`·`scoreBasis`·`disclosureType`·`signalGuide`·AI 인사이트). (2) 서버 `metadata`/OpenGraph 한국어 고정. (3) `/terms`·`/privacy` 영어 요약만 — 전문 법무 번역 잔여. (4) `/en` URL 미도입.
- **다음**: 종목 상세 라이브러리 파생 문구 로케일화 → `/en` URL 라우팅 + `metadata` 다국어화.

### 영어 지원 v2 — 핵심 제품 화면 다국어화 (2026-06-28, Claude · task 89)
- **범위**: v1(진입/로그인/내비) 위에서 해외 사용자가 실제로 쓰는 화면을 영어로 확장. 반영: `/stocks`, `/stock/[ticker]`, `/today`, `/disclosures`, `/pricing`, `/status`, `/guide/metrics`, `/terms`·`/privacy`(영어 요약 토글), 데이터 신뢰 레이어(헤더 데이터바·DataTrustModal·RiskNotice·TodayStatusBar). 클라이언트 전환(쿠키/localStorage/`?lang=`) 유지, `/en` URL·`metadata` 다국어화 미도입.
- **아키텍처**: 화면별 카피를 `src/lib/copy/*.ts`(`{ko,en} as const satisfies Record<Locale, unknown>`)로 분리(공유 `i18n.ts` 미수정, 병렬 작업 충돌 회피). 서버 page는 `metadata`/`generateStaticParams`/`revalidate`/점수·데이터 호출 유지, 보이는 JSX만 새 `"use client"` 콘텐츠 컴포넌트로 추출. 데이터 신뢰 문자열은 `src/lib/dataStatus.ts`에 **가산** 영어 레이어(`LocalizedDataStatus`·`dataStatusByLocale`·`localizedDataStatus`·`buildDataIssueMailto({locale})`) 추가 후 서버→클라 직렬화 props로 전달(`stocks.json` 클라 미번들; `AppHeader`→`LocalizedDataTrustModal` 선례).
- **신규**: 카피 `src/lib/copy/{trust,stocks,stockDetail,today,disclosures,pricing,status,metricsGuide,legal}.ts` + 클라 콘텐츠 `HeaderDataBar`·`PricingContent`·`MetricsGuideContent`·`StatusContent`·`ReportDataIssueContent`·`RiskNoticeContent`·`TodayContent`·`TodayStatusBarContent`·`StockDetailIntro`·`DisclosuresIntro`·`LegalEnSummary`.
- **검증**: `tsc --noEmit` 0 · `npm run build` 0(전 라우트 + 138 종목 SSG) · `npm run app:check` 통과 · `git diff --check` 0(CRLF 경고만) · U+FFFD 0. 로컬 prod 3517(내 PID만 종료·**4310 무중단**) 11라우트 + `?lang=en` 200, 빌드 청크에 EN 카피 컴파일 확인.
- **남은 갭(후속)**: 서버 `metadata` 한국어 고정; 라이브러리 파생 문구가 EN에서도 한국어(`@/lib/conclusion`·`composeReasonV2`·`metricReadings`·`scoreBasis`·`disclosureType`·`signalGuide`, 홈 `StockCandidateCard`·`MarketSnapshotCards`, AI 인사이트 LLM 출력); `/terms`·`/privacy`는 **영어 요약만 — 전문 법무 번역은 운영자/법무 검토 잔여**; 헤더 워드마크 브랜드 한국어 유지; `/en` URL·OpenGraph 미도입.
- **다음**: 라이브러리 파생 문구 + 홈 카드 로케일화 → `/en` URL 라우팅 + `metadata`/OpenGraph 다국어화.

### 영어 지원 v1 — 핵심 진입/로그인/내비게이션 다국어화 (2026-06-28, Codex)
- `src/lib/i18n.ts`와 `LanguageProvider`/`LanguageSwitcher`를 추가했다. 서버 루트 레이아웃에서 `cookies()`를 읽지 않아 기존 정적 생성 경로를 동적으로 바꾸지 않는 클라이언트 전환 방식이다.
- 영어 전환 범위: 홈 온보딩·히어로, 검색창, App navigation(사이드바/모바일 메뉴/하단 탭), 로그인 페이지 소셜/이메일/오류 안내, 비교 배지, footer. 종목명·섹터·데이터 날짜 원문과 일부 서버 데이터 상태/Trust modal 문구는 아직 한국어가 남아 있다.
- 로컬 검증: `npx tsc --noEmit` 통과. dev 서버 `http://127.0.0.1:3000`에서 `?lang=en` 홈/로그인 영어 전환, `?lang=ko` 한국어 기본 복귀 확인.
- 다음 추천: `/stock/[ticker]`, `/today`, `/stocks`, `/disclosures`, `/pricing`, `/terms`, `/privacy`, DataTrustModal을 페이지별 dictionary로 확장하고, 실제 해외 유입을 원하면 `/en` URL 라우팅·metadata/OpenGraph 다국어화를 별도 작업으로 추가.

### Naver 로그인 실동작 확인 + 약관/개인정보 정합성 갱신 (2026-06-28, Codex/User)
- 운영자가 공개 사이트에서 네이버 로그인이 실제로 동작함을 확인했다. 현재 인증 제공자는 카카오·구글·네이버·이메일 매직링크다.
- 공개 문구 정합성 후속으로 `src/app/privacy/page.tsx`와 `src/app/terms/page.tsx`를 카카오·구글·네이버 기준으로 갱신했다. 개인정보처리방침 위탁 처리에 Naver(대한민국, 네이버 계정 식별자·이메일)를 추가했고, 국외이전 표 설명은 Kakao/Naver 국내·Google 미국으로 정리했다.
- `docs/auth-providers-setup.md`, `docs/app-roadmap.md`, `docs/ornscore-owner-final-checklist.md`, `PROGRESS.md`도 네이버 실로그인 완료 상태로 맞췄다.
- 남은 인증 게이트는 실기기 홈 화면 추가/standalone 앱 컨텍스트에서 네이버·카카오·구글 OAuth 복귀와 watchlist 복귀 확인이다.

### Naver Custom OAuth2 준비 + 실기기 게이트 재정리 (2026-06-28, Codex)
- `@supabase/auth-js` 2.107.0의 Provider 타입에 `custom:${string}`이 있음을 확인했고, 공식 Supabase Custom OAuth/OIDC Providers 문서 기준 Free plan에서도 custom provider 3개까지 가능하므로 네이버의 1순위 경로를 **Supabase Custom OAuth2 provider `custom:naver`**로 갱신했다.
- 코드: `src/lib/auth/providers.ts`에 `custom:naver` 설정을 추가하되 `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true`일 때만 활성화한다. 기본 상태에서는 `/login`에 **"네이버 (설정 필요)" 비활성 항목**만 보이며 onClick/인증 호출 없음. `src/app/login/page.tsx`는 활성/비활성 네이버 아이콘 조건과 미설정 오류 안내를 갱신했다.
- 문서: `docs/auth-providers-setup.md` Naver 섹션을 네이버 Developers + Supabase Custom OAuth2 + Vercel env 토글 절차로 갱신했고, `docs/app-roadmap.md`/`docs/ornscore-owner-final-checklist.md`/`PROGRESS.md`도 같은 상태로 맞췄다. `.env.example`에 `NEXT_PUBLIC_ENABLE_NAVER_LOGIN="false"` 추가.
- 운영자 게이트: 네이버 UserInfo 응답은 `response.id`/`response.email` 중첩 구조라 Supabase Custom OAuth2가 실제 세션을 정상 생성하는지 콘솔 저장 후 왕복 테스트가 필요. 실패하면 env를 끄고 앱 자체 Naver OAuth 어댑터 라우트를 별도 작업으로 검토.
- 다음: 운영자가 네이버 Developers 앱 + Supabase provider `custom:naver` 설정 → Vercel env `NEXT_PUBLIC_ENABLE_NAVER_LOGIN=true` → 재배포 → 실기기 standalone에서 네이버/카카오/구글 OAuth 복귀 확인.

### 스토어 제출 준비 패키지 초안 (2026-06-28, Codex)
- `docs/app-store-submission-pack.md`를 추가했다. Google Play/App Store 등록 설명 초안, 스크린샷 후보, 리뷰 노트, 개인정보 답변 초안, 심사 리스크를 한 곳에 모았다.
- 초안은 현재 공개 문구(`/about`, `/privacy`, `/terms`, `/pricing`)와 맞춰 작성했다. 투자 추천 아님, 유료 결제 미제공, Pro/Premium 가격 미확정 상태를 유지한다. 이후 Naver는 실로그인 확인 완료 상태로 전환됐다(위 2026-06-28 Naver 노트 참조).
- `docs/app-packaging-final-checklist.md`와 `docs/ornscore-owner-final-checklist.md`에서 새 문서를 참조하도록 연결했다.
- 다음 외부 게이트는 실기기 PWA 로그인 복귀 확인, Android TWA 우선 여부 결정, Play Console/패키지명/SHA-256 지문 확보.

### 앱 패키징 마감 게이트 추가 (2026-06-28, Codex)
- `src/app/manifest.ts`의 깨진 앱 이름/설명/shortcuts 문구를 정상 한국어로 복구했다. 설치 이름은 `오른스코어`, 긴 이름은 `오른스코어 — 한국 주식 탐색 도구`.
- `scripts/check-app-packaging.mjs`와 `npm run app:check`를 추가해 PWA 아이콘, manifest 필드, 설치 도우미, 오프라인 안내, service worker 미등록, assetlinks 자리표시자 미배포를 확인한다.
- `scripts/generate-assetlinks.mjs`와 `npm run app:assetlinks`를 추가했다. Android TWA 진행 시 실제 패키지명과 서명 SHA-256 지문이 생긴 뒤에만 `public/.well-known/assetlinks.json`을 생성한다.
- `docs/app-packaging-final-checklist.md`에 PWA/TWA/iOS 마감 상태와 운영자 직접 확인 항목을 정리했다. 남은 외부 게이트는 실기기 standalone 로그인 복귀 확인, Play Console/패키지명/SHA-256, Apple Developer/Mac/Xcode 여부다.

### Google 로그인 운영자 콘솔 설정 완료 (2026-06-28, Codex/User)
- 운영자가 Google Cloud OAuth Client + Supabase Authentication Provider 설정을 완료했고, `https://ornscore.com/login`에서 실제 Google 로그인 왕복이 정상 동작함을 직접 확인했다.
- 코드 변경은 필요 없었다. Task 70의 Google OAuth 버튼/콜백/약관·개인정보 문구가 그대로 실동작 상태가 됐다.
- 남은 인증 관련 운영자 결정: Naver는 Supabase 기본 OAuth provider가 아니므로 계속 "준비 중" 상태. 실제 활성화하려면 앱 자체 Naver OAuth 라우트 + 세션 발급 설계 또는 Supabase custom OIDC/Pro 경로 중 하나를 별도 작업으로 선택해야 한다.
- 다음 직접 확인 권장: 실기기 PWA 설치, standalone Kakao/Google/email 복귀, watchlist 복귀, 알림 설정, 법적/소개 문구 확인.

### Task 87 (repair 2) — Pretendard 폰트 하이드레이션 불일치 제거 (Playwright 게이트 수복) (2026-06-27, Claude)
- **증상**: Playwright DESKTOP FAILED + MOBILE 스크린샷 타임아웃, 공통 `Warning: Prop media did not match. Server: "all" Client: "print"` (`layout.tsx` `<head><link>`). 직전 repair(`cde711b`)가 SSR에 `<link media="print">`를 렌더 후 인라인 스크립트로 `media='all'` 승격 → DOM 변형이 React 하이드레이션 전에 일어나 서버(`print`)↔실제 DOM(`all`) 불일치 경고가 매 렌더 발생, 게이트가 실패 처리.
- **수정**: `src/app/layout.tsx` `<head>`에서 스왑 대상 `<link media="print">`와 별도 승격 스크립트를 제거하고, 인라인 스크립트가 `document.createElement('link')`로 `media='print'` 링크를 만든 뒤 `onload`에서 `media='all'` 승격하도록 교체. React가 렌더하지 않은 노드라 하이드레이션이 비교할 노드 자체가 없음(경고 억제가 아니라 구조적 제거). `preconnect`·`<noscript>` 폴백 유지. 프로덕션 Pretendard 유지, 오프라인/헤드리스는 시스템 한글 폰트 폴백 즉시 렌더. **`globals.css`·점수식·`stocks.json`·인증·manifest 무변경, 신규 npm 0.**
- **What passed**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(SSG 138p). 로컬 prod **3187**(내 PID 14092만 taskkill·**AI Center 4310 무중단**): 13개 라우트 200, SSR `<head>` `media="print"` 스타일시트 링크 0건·JS 주입 스크립트 존재 확인. `layout.tsx` U+FFFD 0.
- **Next**: 게이트 재실행으로 desktop/mobile 통과 확인. 기능/운영자 잔여는 Task 87 본 노트 그대로.

### Task 87 — 로컬 최종 상용 준비도 마감 (라우트 스모크 + 운영자 전용 체크리스트 + 핸드오프) (2026-06-27, Claude)
- **결정/범위**: Task 77 위 **로컬 전용 QA·문구·핸드오프 마감** = AI가 코드로 고칠 로컬 갭과 운영자만 할 수 있는 폰/계정/법무 점검 분리. branch `ai-center/task-87-...`(HEAD `5d33e25`=origin/main 클린 시작). **신규 npm 0 · 리셋/pull/머지/push 0 · env 0 · `src` 코드·`stocks.json`·점수식·`direction`·manifest·인증 config 무변경 · 가짜 OAuth/세션 0 · 레포 밖 변경 0.**
- **정적 감사(읽기 전용)**: `/about`·`PwaInstallHelper`·`manifest.ts`·`/pricing`·`/status`·`/privacy`·`/terms`·`/login`·`providers.ts`+docs 전수 → (a) 스토어 과대표현 0, (b) PWA 설치 한계 충분 설명, (c) 제공자 정합(`/login` 카카오·구글·이메일+네이버"준비 중", Apple 미노출 — privacy/terms/auth-setup 일치), (d) 베타→Pro·미확정 존재. 매수/매도/수익보장 문구 0. **→ 공개 문구 추가 수정 불필요로 확인(편집 0).**
- **Changed (신규 1 + 문서 3)**: `docs/ornscore-owner-final-checklist.md`(신규 — §A AI 완료/§B 운영자 전용[B-1 실기기 QA 7항·B-2 계정·서명 지문·package id·B-3 결제·법무]/§C 다음 단계, 실기기 OAuth 복귀는 app-roadmap §5-1·패키징 사전점검은 app-packaging-readiness §4로 cross-link) / `docs/app-roadmap.md`(§6 Task 87 포인터)·`PROGRESS.md`·이 노트.
- **What passed**: pre/post `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(전 라우트) · 변경 문서 U+FFFD 0. 로컬 prod **3370**(내 PID 35204만 종료·**AI Center 4310 무중단**): 14개 라우트 200, `/auth/callback`(no code) 307→`auth_callback_no_code`, manifest `application/manifest+json`, SSR 마커(제공자·베타→Pro·투자추천아님·Metrics 2.4) 일치. 스테일 청크 미발생(클린 빌드 후 start).
- **운영자 전용 잔여(checklist 참조)**: §B-1 실기기 폰 설치·아이콘 품질·standalone OAuth/watchlist 복귀·알림 설정·법적 문구(Playwright 미구성 게이트). §B-2 서명 SHA-256 지문·package id·Play$25/Apple$99 결제·네이버 콘솔. §B-3 결제 게이트 연결·약관/데이터 법무 최종 승인.
- **Next**: 운영자 checklist §C — (1) 실기기 OAuth 복귀(app-roadmap §5-1) → 깨지면 콜백 보강 큐, (2) 첫 스토어 결정 → 서명 지문 확보 시 예시 assetlinks 실값 배치, (3) 결제·법무 확정 후 결제 게이트 연결.

### Task 77 — 앱 패키징 준비도 체크리스트 + 안전한 assetlinks 예시 (2026-06-27, Claude)
- **결정/범위**: Task 76 위 app-readiness 후속 = **다음 패키징 결정을 채팅 기록 없이 고를 수 있게 문서화**(마케팅·스토어 발표 아님). branch `ai-center/task-77-...`(Task 76 `24cf1c6` 위 클린 시작). **문서 전용 — `src/`·`stocks.json`·점수식·`direction`·인증·manifest 무변경. 신규 npm 0 · SW 0 · 리셋/pull/머지/push 0 · env 0 · `public/.well-known` 미생성(가짜 서명 관계 파일 0).**
- **Changed (신규 2 + 문서 3)**: `docs/app-packaging-readiness.md`(신규 — 결정 트리 PWA-only→TWA→iOS 홈/래퍼→Capacitor 각 "다음 인간 결정·전제" + 경로별 에셋/비용/QA 게이트/반려 리스크 표 + 실기기 사전 점검 체크리스트(설치 아이콘·standalone 내비·로그인 복귀(roadmap §5-1 cross-link)·watchlist·알림 설정·오프라인·법적 고지) + "이 작업에서 하지 않는 것") / `docs/templates/assetlinks.example.json`(신규, `public/.well-known` **밖**, Digital Asset Links 배열·`com.example.ornscore`·`REPLACE_WITH_REAL_SHA256_FINGERPRINT` 자리표시자·**서빙 안 함**) / `docs/app-roadmap.md`(§3 TWA 항목 예시 파일 메모 + §6 포인터)·`docs/ornscore-spec-coverage.md`(§8 H §24 PWA 행 Task 77 노트)·`PROGRESS.md`·이 노트.
- **What passed**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(전 라우트) · 변경 4문서 U+FFFD 0. **문서 전용이라 `/about`+`/manifest.webmanifest` 스모크 불필요**(app-facing 소스 무변경) — AI Center 4310·미리보기 3000 무중단(임시 서버 미기동). `public/.well-known` 부재 재확인.
- **게이트 한계 / 잔여(운영자)**: 실 서명 키 SHA-256 지문·Play($25)/Apple($99/년) 계정 결제·실기기 QA는 운영자 게이트. assetlinks 실파일은 실 지문 생긴 뒤에만 `public/.well-known/assetlinks.json`로 배치. 스토어 출시 여부 "미확정" 유지.
- **Next**: 운영자 — 첫 스토어(TWA vs iOS) 결정 → 서명 지문 확보 시 예시→실 assetlinks 배치 → roadmap §5-1 + 본 문서 §4 실기기 점검. 큰 축은 ④ 결제·⑤ 법무.

### Task 76 — standalone 앱 로그인 복귀 + 내부 딥링크 정규화 (open-redirect 가드) (2026-06-27, Claude)
- **결정/범위**: Task 75(설치 UX) 위 후속 = app/PWA 경로의 **로그인 복귀·내부 딥링크 견고화**(네이티브 래퍼 결정 전 선결). branch `ai-center/task-76-...`(Task 75 `9df4313` 위 클린 시작). **신규 npm 0 · 가짜 로그인 성공 경로 0 · 리셋/pull/머지/push 0 · env 0.** 제공자 config(`OAUTH_PROVIDERS`/`PLANNED_PROVIDERS`)·Supabase·점수식·`stocks.json`·`direction` 무변경. 네이버 "준비 중"·Apple `enabled:false`·카카오/구글/이메일 동작 불변.
- **Changed (신규 1 + 코드 4 + 문서 3)**: `src/lib/auth/returnPath.ts`(신규 `safeInternalPath` — 의존성 0·ASCII-only open-redirect 가드) / `src/app/auth/callback/route.ts`(`safeInternalPath` 사용 + `code` 없음=`auth_callback_no_code` vs 교환오류=`auth_callback_failed` 분기 + 검증된 `next` 보존) / `src/app/login/page.tsx`(`next`를 `safeInternalPath`로 정규화 → 뒤로가기/redirectTo 외부 URL 불가 + `friendlyAuthError`에 `auth_callback_no_code` 한국어 매핑) / `src/components/AccountButtons.tsx`·`src/components/MobileNav.tsx`(로그인 진입점 `next`를 현재 내부 위치+search에서 만들어 `safeInternalPath` 통과) / `docs/app-roadmap.md`(§5 OAuth 행 코드 가드 명시 + 신규 §5-1 실기기 QA 8단계 + §6 next 3)·`PROGRESS.md`·이 노트. 하드코딩 내부 리터럴 진입점(WatchlistClient/history/settings·notifications/StocksExplorer)은 안전 확인 후 무변경.
- **정규화기 규칙**: 빈값→fallback("/"), 백슬래시→슬래시 정규화(`\\`/`/\` 우회), 길이 ≤512, 제어문자/공백(≤0x20·0x7F) 거부(`charCodeAt` 루프 — 리터럴 제어바이트 임베드 회피), `"://"` 거부, 반드시 `"/"` 하나로 시작(`//` 프로토콜-상대 거부), query/hash 보존.
- **What passed**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(전 라우트) · 변경 6파일 U+FFFD 0·제어바이트 0. 로컬 prod 3352(내 PID 33624만 taskkill, 4310 무중단·3000 본래 미기동): `/login`·`/login?next=/watchlist`·`/watchlist`·`/history`·`/settings/notifications` 200. **콜백**: code 없음 307→`/login?error=auth_callback_no_code`; `?next=//evil.com`·`?next=https://evil.com` 외부 미복귀(next 미부착); `?next=/watchlist`→`&next=%2Fwatchlist` 보존. 친절 문구 클라 번들 컴파일 확인.
- **게이트 한계**: Playwright 미구성 → **실기기 standalone 실제 OAuth 복귀(Kakao/Google 앱 창)는 운영자 게이트**(§5-1). 코드 측 가드는 완료 — 복귀 자체 깨지면 콜백 추가 보강 별도 큐.
- **Next**: 운영자 §5-1 8단계 실기기 검증 → 깨지면 콜백 보강. 큰 축은 ④ 결제·⑤ 법무.

### Task 75 — PWA 설치 프롬프트 + standalone UX 폴리시 (정직한 설치 도우미) (2026-06-27, Claude)
- **결정/범위**: Task 74(아이콘 에셋) 위 app-readiness 후속 = **마케팅 아님**, 실용 설치 UX. `/about` "앱처럼 설치하기" 섹션의 정적 수동 단계를 **클라이언트 설치 도우미**로 교체 — 가짜 버튼 없이 브라우저가 `beforeinstallprompt`를 줄 때만 실제 설치를 제안하고, 이미 설치(standalone)된 사용자에겐 다시 권하지 않는다. 브랜치 `ai-center/task-75-...`(Task 74 `0cdc496` 위 클린 시작). **신규 npm 0 · service worker/캐싱 0(§4 데이터 신선도 결정 유지) · manifest 아이콘 무변경 · 리셋/pull/머지/push 0 · env 0.** 공개 문구 PWA/홈 화면 추가만(App Store·Play 주장 0).
- **Changed (신규 1 + 코드 1 + 문서 3)**: `src/components/PwaInstallHelper.tsx`(신규, `"use client"`) / `src/app/about/page.tsx`(정적 `<ul>` → `<PwaInstallHelper />`, import 추가; 섹션 `<h2>`·인트로·네트워크/스토어 미확정 각주·`Smartphone` 아이콘·카드 스타일 보존) / `docs/app-roadmap.md`(§1 '설치 프롬프트 UX' 행·§2-1·§6 next)·`PROGRESS.md`·이 노트. 점수식·`stocks.json`·`direction`·인증·manifest 무변경.
- **컴포넌트 동작(SSR 안전)**: `window`/`navigator` 가드. 로컬 최소 `BeforeInstallPromptEvent` 인터페이스(신규 타입 의존 0). `beforeinstallprompt`→`preventDefault()`+보관, `appinstalled`→설치 직후 standalone 전환. standalone 감지 = `matchMedia('(display-mode: standalone)') || navigator.standalone`. **3-상태 상호배타**: (a) standalone="이미 앱으로 실행 중"(권유 0) / (b) 프롬프트 보유=실제 "앱 설치" 버튼(violet-600·`min-h-[44px]`·full-width, `prompt()`→`userChoice` 후 이벤트 비움) / (c) 그 외=iOS/Android 수동 단계. **SSR 기본 = (c)** 폴백이라 비지원 환경도 정직.
- **What passed**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(전 라우트, `/about` 포함) · 변경 .ts/.tsx U+FFFD 0. 로컬 prod 3346(내 PID 37740만 taskkill, 4310·3000 무중단): `/about` 200 SSR '앱처럼 설치하기'·'홈 화면에 추가'·'Android(Chrome)' 수동 폴백 렌더, `/manifest.webmanifest` 200 `application/manifest+json`(불변), 클라 번들 `app/about/page-*.js`에 `beforeinstallprompt`·'이미 앱으로 실행 중' 컴파일 확인.
- **게이트 한계**: Playwright 미구성 → 390px 실 브라우저 육안·실제 `beforeinstallprompt`는 **운영자 게이트**. 실 프롬프트는 설치 가능 origin + 지원 브라우저(Android Chrome)에서만 발화 → 데스크톱/SSR은 수동 폴백 노출(정상, 버그 아님). 운영자: 390px `/about` 설치 섹션 오버플로 0·설치 컨트롤 사용성 1회 확인.
- **Next**: 실기기 standalone 실행 + **OAuth 복귀**(app-roadmap §5 최대 리스크) 검증 → 깨지면 콜백 보강(별도 큐). 같은 세션에서 Android 설치 버튼·iOS 수동 흐름 육안. 첫 스토어(TWA vs iOS) 결정은 제품/운영자.

### Task 74 — PWA PNG 아이콘 에셋(192/512/maskable/apple-touch) + 매니페스트/메타 연결 (2026-06-27, Claude)
- **결정/범위**: Task 72에서 운영자 보강으로 남겨둔 PNG 아이콘을 **코드로 생성·연결**(실용 app-readiness, 마케팅 아님). 브랜치 `ai-center/task-74-...`(Task 72 `abad23c` 위 클린 시작). **신규 npm 0·SW 0(§4 데이터 신선도 결정 유지)·리셋/pull/머지/push 0·env 0.** 공개 문구 PWA/홈 화면 추가만.
- **생성기(외부 의존 0)**: `scripts/generate-icons.mjs` — Node `fs`+`zlib`만으로 `src/app/icon.svg` 마크를 RGBA 버퍼에 4x 슈퍼샘플 AA로 직접 렌더 → 유효 PNG(시그니처+IHDR+IDAT(deflateSync)+IEND, 청크별 CRC32) 인코딩(SVG 래스터라이저 없음). 치수 검증 `scripts/check-icons.mjs` — 8바이트 PNG 시그니처 + IHDR 폭/높이(offset 16/20) 파싱으로 192/512/512/180 정확 단언, 불일치 시 exit 1.
- **Changed (코드 2 + 신규 스크립트 2 + 에셋 4 + 문서 3)**: `public/icon-192.png`(192²,any,라운드)·`public/icon-512.png`(512²,any)·`public/icon-512-maskable.png`(512²,maskable,안전영역 10% 패딩)·`public/apple-touch-icon.png`(180²,불투명 풀블리드) / `scripts/generate-icons.mjs`·`scripts/check-icons.mjs` / `src/app/manifest.ts`(icons에 PNG 192/512 any + 512 maskable 추가, `/icon.svg` 폴백 보존, 주석 갱신)·`src/app/layout.tsx`(`metadata.icons` icon+apple 추가 → apple-touch-icon <link> 방출) / `docs/app-roadmap.md`(§1 표·판정·§2-1·§3 체크리스트·§6 done)·`PROGRESS.md`·이 노트. title/OG/twitter/robots/JSON-LD·점수식·stocks.json·`direction` 무변경.
- **What passed**: `tsc --noEmit` 0 · `check-icons.mjs` 4/4 OK(시그니처+정확 치수) · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(전 라우트). 로컬 prod 3340(내 PID만 taskkill, 4310 무중단·3000 본래 미기동): `/manifest.webmanifest` 200 `application/manifest+json`·icons에 PNG 3종(192/512 any + 512 maskable), 4개 아이콘 URL 200 `image/png`, `/`·`/about` `apple-touch-icon` <link> 방출(sizes 180x180), `/about` 설치 섹션 렌더. 변경 .ts/.tsx U+FFFD 0. **스토어 출시 약속 0.**
- **남은 단계**: (운영자/제품) 첫 스토어 결정(TWA Play $25+assetlinks vs iOS App Store 래퍼 $99/yr) → 해당 패키징 별도 작업 · 실기기 standalone **OAuth 복귀** 검증(§5 최대 리스크) · (선택) navigation-only network-first SW(데이터 JSON 비캐시 고정 시).
- **Next**: 운영자 첫 스토어(TWA vs iOS) 결정 + 실기기 OAuth standalone 복귀 확인.

### Task 72 — PWA 앱 준비도 (manifest 메타 + 설치 안내 + 앱 로드맵) (2026-06-27, Claude)
- **결정/범위**: "오른스코어도 앱이 되어야 한다" = 마케팅 랜딩이 아니라 **설치 가능 앱(PWA) 준비도 + 네이티브 배포 안전 경로 문서화**. 브랜치 `ai-center/task-72-...`(Task 73 `f728604` 이후 그대로). **신규 npm·lock 변동·Capacitor/RN 도입 0, 리셋/pull/머지/push 0, env/시크릿 0.**
- **감사 결과**: manifest ✔ / `/offline` 정적 안내 ✔ / **service worker 미등록(의도적)** / 아이콘 SVG only(PNG·maskable·apple-touch 없음). 설치 가능하나 아이콘 품질·설치 배너는 PNG 에셋 보강 시 1급.
- **Changed (코드 2 + 문서 신규 1 + 기록 2)**: `src/app/manifest.ts`(`id:"/"`·`categories:["finance"]`·`dir:"ltr"`·`shortcuts` 3종 추가, 색/아이콘/기존 필드 보존, 미존재 PNG 경로 미기재)·`src/app/about/page.tsx`(비마케팅 "앱처럼 설치하기" 소형 섹션, iOS/Android 단계+`/offline` 링크+네트워크 필요+**스토어 미확정 명시**, 새 nav 탭/히어로 0)·`docs/app-roadmap.md`(신규)·`PROGRESS.md`·이 노트. 인증/산식/stocks.json/`direction` 무변경, 고지 약화 0.
- **app-roadmap.md 핵심**: PWA 감사표 / 네이티브 경로 **PWA→Android TWA(Bubblewrap, Play Console $25 1회 + assetlinks)→iOS(홈 추가 지금 / App Store 래퍼 Apple $99/yr)→Capacitor(레포 미수용, 범위 외)** / 운영자 에셋·계정 체크리스트 / **SW 미등록 결정 + 사유(데이터 신선도가 신뢰 배지와 충돌)·미래 안전형(navigation-only network-first, 데이터 JSON 비캐시)** / 앱 기능별 인증 준비도(OAuth standalone 복귀가 최대 리스크·Naver 준비 중·푸시 SW의존·watchlist·딥링크 scope).
- **What passed**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(전 라우트). 로컬 prod 3332(내 PID만 taskkill, 4310·3000 무중단): `/ /login /offline /manifest.webmanifest /status /about /stock/005380` 전부 200, manifest JSON에 신규 `id`·`categories`·`dir`·`shortcuts` 확인, about SSR "앱처럼 설치하기"·"홈 화면에 추가" 렌더. 변경 파일 U+FFFD 0. **공개 문구 스토어 출시 약속 0.**
- **남은 단계**: (운영자) PNG 192/512·maskable·apple-touch-icon 제작→`manifest.ts`/layout 연결 · 첫 스토어(TWA vs iOS 래퍼) 결정 + 계정($25 / $99/yr) · 실기기 OAuth standalone 복귀 검증 · (선택) navigation-only SW.
- **Next**: 운영자 아이콘 에셋 공급 + 첫 스토어 결정 → 해당 패키징 별도 작업.

### Task 73 — 네이버 로그인 준비중 노출 + 운영자 설정 문서화 (네이티브 미지원) (2026-06-27, Claude)
- **결정(가짜 세션 안 만듦)**: 설치 `@supabase/auth-js` 2.107.0 `Provider` 유니온에 **`naver` 없음** 재확인 → 네이티브 OAuth 불가. 안전한 두 경로((A) 앱 자체 OAuth 라우트 + service-role 세션 발급, (B) Supabase Pro 커스텀 OIDC) **모두 운영자 측 설정 선행 필요** → 본 작업(신규 npm·유료·env 금지) 범위 밖. 따라서 **실 라우트 미구현**, `/login`에 **"네이버 (준비 중)" 비활성 항목만 노출** + 운영자 설정 절차 문서화.
- **Changed (코드 2 + 문서 3)**: `src/lib/auth/providers.ts`(신규 `PLANNED_PROVIDERS`/`plannedProviders()`, id=`"naver"`를 **의도적으로 `OAuthProviderId`가 아니게** 둬서 `signInWithOAuth`에 못 넘김=가짜 경로 tsc 차단; `OAUTH_PROVIDERS`/`enabledOAuthProviders` 무변경)·`src/app/login/page.tsx`(활성 버튼 아래 비활성 `<div aria-disabled cursor-not-allowed>` + "준비 중" 배지, **onClick·인증 호출 0**; 카카오·구글·이메일·`next`·`friendlyAuthError`·`leadCopy` 무변경)·`docs/auth-providers-setup.md`(Naver 섹션 (A)/(B) 운영자 절차 상세)·`PROGRESS.md`·이 노트.
- **불변(회귀 0)**: 카카오·구글·이메일 매직링크·`/auth/callback`(307 불변)·`signInWithOAuth`·`src/lib/supabase/*`. 약관/개인정보 활성 처리자 목록(카카오·구글)에 네이버 미추가(실데이터 0).
- **What passed**: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·**Metrics 2.4** · `npm run build` 0(`/login` 포함) · 변경 3파일 U+FFFD 0. 로컬 prod 3331: `/login`·`/login?next=/watchlist`·`/privacy`·`/terms` 200 · `/auth/callback`(no code) 307 · `/login` SSR 카카오·구글·이메일+**"네이버 (준비 중)" 1·`aria-disabled` 1·naver 인증 URL 0** · privacy/terms 네이버 활성 주장 0. AI Center 4310·미리보기 3000 무중단(내 PID 22092만 taskkill).
- **남은 운영자 설정(네이버 실동작 시)**: (A) 네이버 Developers 앱+콜백 URL 등록 → `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`을 **Supabase/Vercel env에만**(소스 금지) → `state`+nonce CSRF·`next` 보존 start/callback 서버 라우트 → **service-role 세션 발급 설계**(핵심 선결), 또는 (B) **Supabase Pro/Enterprise 업그레이드** + 커스텀 OIDC 콘솔 구성. `docs/auth-providers-setup.md` Naver 섹션 참조. 둘 중 하나 완료 전까지 "준비 중" 유지.
- **Next**: 운영자가 (A)/(B) 결정·설정 → 네이버 실 로그인 별도 작업. Task 72(앱 readiness) 후속 계속.

### Task 70 (게이트 수리) — /login 이메일 input hydration 경고 제거 (2026-06-27, Claude)
- 블로커(Playwright MOBILE FAIL): `Extra attributes from the server: ... style`가 `src/app/login/page.tsx` `LoginForm` 이메일 `<input>`에서 발생. 일부 브라우저/비밀번호 관리자 확장이 input 에 `style` 주입 → SSR↔클라 hydration 경고(모바일·이메일 필드 빈발). 소스에는 input style 없음.
- 수리(포커스 1파일): 이메일 input 에 `suppressHydrationWarning`(+`autoComplete="email"`) 추가. 저장소 기존 관행과 동일(`GlobalSearch.tsx:139`·`StocksExplorer.tsx:758`). 로직·문구·`next` 보존·friendly 오류·제공자 config 무변경.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·Metrics 2.4 · `npm run build` 0(`/login` 포함). 신규 npm·빌드 단계 0.
- Next: 아래 Task 70 본문과 동일(운영자 Supabase Google 토글 → `/login` 구글 실동작 검증).

### Task 70 — OrnScore 로그인 제공자 확장 (구글 추가·제공자 config화·friendly 오류·약관/개인정보 동기화) (2026-06-27, Claude)
- What: 상용화 대비 인증 확장. **카카오 OAuth + 이메일 매직링크 + 로그인 후 `next` 복귀 전부 보존**. branch `ai-center/task-70-ornscore-auth-provider-expansion-and`, 시작 HEAD `bbc5876`(클린). **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`direction`·계정 테이블 무변경. AI Center 4310 무중단(검증 prod 3321, 내가 띄운 PID 36724만 taskkill). 미리보기 3000 미기동 유지.
- 제공자 가용성(설치 `@supabase/auth-js` 2.107.0 `Provider` 유니온): **google ✅·apple ✅(타입)·kakao ✅(운영 중)·naver ❌**. naver는 커스텀 OIDC/SAML(Pro/Enterprise) 또는 직접 OAuth 라우트 필요 → 신규 의존성·유료 금지 범위상 보류(가짜 구현 안 함). SMS/Phone도 외부 게이트웨이·비용 → 보류.
- Changed (코드 4 + 신규 2 + 문서 2):
  - 신규 `src/lib/auth/providers.ts` — OAuth 제공자 단일 출처(`OAUTH_PROVIDERS`/`enabledOAuthProviders()`). kakao·google `enabled:true`, **apple `enabled:false`(의사결정 주석: $99/년 Developer Program·iOS/macOS 중심 → 보류, config는 완비 → 한 줄로 활성화)**. naver 미추가(블로커 주석).
  - 리팩터 `src/app/login/page.tsx` — 제네릭 `handleOAuthLogin(provider)` 1개로 통합(복붙 제거), config map으로 버튼 렌더(카카오 첫 순서·구글 SVG), `oauth_redirecting`+`redirectingProvider` 일반화, `redirectTo=.../auth/callback?next=` 보존, `friendlyAuthError()`로 콜백 실패/`provider is not enabled`/rate-limit 등 한국어 변환(원문 영어 미노출), 리드 카피 enabled 목록 파생("카카오·구글로...").
  - `src/components/WatchlistClient.tsx:302` — 동기화 CTA `/login` → `/login?next=/watchlist`(유일한 bare `/login`이었음; 나머지 게이트 진입점은 이미 next 보존 재확인).
  - `src/app/privacy/page.tsx`·`src/app/terms/page.tsx` — 소셜 로그인 표기를 실제 UI(카카오·구글)와 일치. privacy 위탁사·국외이전 표에 **Google(미국) 행** 추가, 캡션 정정. **Apple은 버튼 미노출이라 약관·개인정보에도 미기재**. naver 미기재.
  - 신규 `docs/auth-providers-setup.md` — 운영자 콘솔 설정 체크리스트(자리표시자만, 시크릿 0): Supabase Providers 토글·redirect URL·Google Cloud OAuth 절차·Apple 보류·Naver/SMS 블로커.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·Metrics 2.4 · `npm run build` 0 · 6파일 U+FFFD 0 · 로컬 prod 3321 9경로 200·`/auth/callback`(no code) 307(→ `/login?error=...`) · SSR: `/login` 카카오·구글 버튼+이메일(Apple 미노출)·"카카오·구글로 1초"·`?error=` friendly 한국어, `/privacy`·`/terms` "소셜 로그인(카카오·구글)"·"제공자 — Google" · 클라 번들에 `/auth/callback?next=` 컴파일 확인.
- 남은 외부 설정(운영자): (1) Supabase → Auth → Providers **Google 토글 ON + Client ID/Secret** → `/login` 구글 실동작(그 전 클릭은 friendly 안내로 graceful). (2) Apple 필요 시 Developer Program 가입 후 `providers.ts` `enabled:true` + 약관/개인정보 Apple 추가. (3) Naver 수요 시 커스텀 OIDC/SAML or 직접 라우트(별도 작업). `docs/auth-providers-setup.md` 참조.
- Gate note: Playwright 미구성 → 운영자 데스크톱/390px로 `/login`(카카오 노랑·구글 흰 버튼·이메일 폼)·`/privacy`(국외이전 표 Google 행) 1회 확인 권장. OAuth 실제 redirect는 콘솔 설정 후 확인.
- Next: 운영자 Supabase Google 토글 설정 → `/login` 구글 로그인 실동작 검증 → (선택) main 머지·외부 릴리스. 큰 축은 ④ 결제·⑤ 법무.

### Task 69 — OrnScore 4차 QA 컴포넌트 마감 (공시 주의 구두점 + 홈 주의 문구 다양화 + CTA/STEP/배지/비교 재검증) (2026-06-27, Claude)
- What: 사용자 4차 QA 리포트 기준 P0-1~4·P1-1~3 마감. branch `ai-center/task-69-ornscore-4th-qa-component-polish-and`, 시작 HEAD `d70f3de`(클린). **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`direction` 무변경(표시/문구만). AI Center 4310 무중단(검증 prod 3319, 내가 띄운 PID 10484만 taskkill). 미리보기 3000은 세션 미기동 상태 유지. main 머지·외부 릴리스 범위 외(운영자).
- 시작 전 재검증(중복 구현 방지): P0-1~4는 직전 배포 `743873a`에서 이미 컴포넌트로 마감 → 소스+SSR 재확인, 재구축 0.
  - P0-1 CTA: `src/components/stock/StockDetailActionButtons.tsx`(grid 1/2/4열·gap-2·min-h-44px·테두리/아이콘). 글루 `공시 확인재무 보기점수 근거업종 비교` SSR 0건.
  - P0-2 STEP: `src/components/BeginnerReading.tsx` `StepCard` 3카드 그리드. SSR STEP 1/2/3 렌더, 글루 0.
  - P0-3 배지: `src/components/stock/PriorityScoreCard.tsx` 독립 `DataStatusPill` 3종(flex-wrap gap-2). 정상/검증보류(suspect) 양쪽 상태 분기(69~76행) — suspect fixture가 SSR에 안 떠도 컴포넌트가 두 상태 지원함을 소스로 확인. 글루 `필수 데이터 100%이상값 점검 통과 Metrics 2.4` SSR 0건.
  - P0-4 비교 빈 상태: `src/components/CompareClient.tsx` 검색·추천 세트·최근 본·관심 종목 UI 존재. `/compare` 200.
- Changed (코드 4파일, 문구·구두점만):
  - [P1-2] `src/components/DisclosureExplorer.tsx:452` 주의 라벨 `주의`→`주의:`(라벨/본문은 이미 별도 span flex gap-1.5 → SSR 추출 글루 `주의'계약 금액 = 이익'` 해소). `src/lib/signalGuide.ts:88` `single_contract.cautionNote`를 캐논 `'계약 금액 = 이익'으로 단순 환산하지 마세요. 마진·거래처 정보가 빠질 수 있습니다.`로 정규화(`으로` 앞 공백·`단순 환산 금지` 변형 제거 → `CAUTION_FALLBACK`과 동일 단일 문구). `SignalGuideExpand`도 같은 캐논 일관.
  - [P1-3] `src/app/page.tsx`·`src/app/today/page.tsx` `riskNote`의 `r3m>=80` 단일 상수를 급등 정도·변동성 조건별 분기(>=150/>=120/vol<45/else)로 교체. 모두 확인·검토 톤(매수/매도/목표가/긴급성 0), 두 파일 로직 동일.
- [P1-1] `src/components/StocksExplorer.tsx:816` 단일 삼항으로 한 번에 한 라벨만 출력(레포 전체 펼치기/접기 grep = 전부 단일 조건 렌더). **이미 충족 — 편집 0**.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·Metrics 2.4 · `npm run build` 0 · 변경 4파일 U+FFFD 0 · 로컬 prod 3319 8경로 200 · SSR 글루 `공시 확인재무…`/`STEP 1점수`/`필수 데이터 100%이상값…`/`펼치기 ▾접기 ▴` 각 0건·STEP 1/2/3 렌더·`/disclosures` `주의:` 9회·구 `주의'계약…`/`단순 환산 금지` 0·홈 후보 주의 문구 3종(6/2/2)·오늘 3종(2/2/2)로 반복 해소.
- Gate note: Playwright 미구성 → **운영자: 데스크톱/390px로 `/stock/005380`(CTA 4버튼·STEP 3카드·배지 3개)·`/compare`(빈 상태)·`/stocks` 1회 확인 권장.** P0 글루는 SSR 텍스트 추출 아티팩트(노드·시각 분리됨).
- Residual / next: 운영자 390px 육안 게이트 → main 머지·외부 릴리스(별도 단계). 큰 축은 ④ 결제 연동·⑤ 데이터/약관 법무(coverage 문서).

### Task 68 — OrnScore 3차 QA P0 마감 (CTA/STEP/배지/비교 재검증 + 행동성 문구 중립화) (2026-06-27, Claude)
- What: 사용자 제공 `ORNSCORE_3rd_QA_improvement_spec.md` PART A(P0-1~5)·PART F 기준 3차 QA P0 마감. branch `ai-center/task-68-ornscore-3rd-qa-p0-polish-detail-ui-`, 시작 HEAD `d63149c`(클린). **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`direction` 무변경(표시/문구만). AI Center 4310·미리보기 3000 무중단(검증 prod 3317, 내가 띄운 PID 37232만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 시작 전 재검증(중복 구현 방지): **P0-1~4는 직전 codex 배포 `743873a`(post-deploy 2nd QA P0)에서 이미 컴포넌트로 마감** — 소스+SSR 재확인으로 재구축 0.
  - P0-1 CTA: `src/components/stock/StockDetailActionButtons.tsx`(grid 1/2/4열·gap·min-h-44px·테두리/아이콘). 글루 `공시 확인재무 보기점수 근거업종 비교` SSR 0건.
  - P0-2 STEP: `src/components/BeginnerReading.tsx` `StepCard` 3카드 그리드(STEP n 단일 배지·제목/본문 분리). 한 줄 글루 0.
  - P0-3 배지: `src/components/stock/PriorityScoreCard.tsx` 독립 pill 3종(flex-wrap gap). 글루 `필수 데이터 100%이상값 점검 통과 Metrics 2.4` SSR 0건.
  - P0-4 비교 빈 상태: `src/components/CompareClient.tsx` 검색·추천 세트·최근 본·관심 종목 추가 UI 모두 존재. `/compare` 200.
- Changed (코드 2파일, 문구만):
  - [P0-5] `src/lib/metricReadings.ts:49` 추세 약세(40 미만) "하락 추세일 수 있음 — 저가 매수일지 추가 하락일지 판단 필요" → "…반등 근거와 추가 하락 위험을 함께 확인"(설계서 §7.3 안2). `BeginnerReading`·`MetricInsightCards` 공유 단일 소스 → 종목 상세 양쪽 반영.
  - [P0-5 일관성] `src/app/theme/[slug]/page.tsx` `evaluate()` "매수 검토 구간"·"분할 매수 권장"·"추가 하락 시 매수 매력 증대" → 확인·검토 톤 중립화. 고지의 "매수·매도 추천이 아닙니다"는 보존.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·Metrics 2.4 · `npm run build` 0 · 변경 2파일 U+FFFD 0·구 문구 grep 0 · 로컬 prod 3317 5경로 200·치명 마커 0(`/theme`만 Git Bash 한글 슬러그 curl 인코딩 아티팩트로 404 — 라우트는 정상 빌드).
- Gate note: Playwright 미구성 → **운영자: 데스크톱/390px로 `/stock/005380`(CTA 4버튼 줄바꿈·STEP 3카드·배지 3개)·`/compare`(빈 상태) 1회 확인 권장.** 설계서 전제(공개 사이트 글루 잔존)는 직전 배포로 이미 해소 — 본 태스크 실 산출물은 P0-5 문구 마감 + P0-1~4 재검증.
- Residual / next: 운영자 390px 육안 게이트 → main 머지·외부 릴리스(별도 단계). 큰 축은 ④ 결제 연동·⑤ 데이터/약관 법무(coverage 문서).

### Task 66 — OrnScore P1 후속 5종 (홈 표시 정책·공시 범위 버튼·베타→Pro·약관·개인정보 표 모바일) (2026-06-26, Claude)
- What: codex P0(1~6) 이후 사용자 리뷰 P1 후속을 반영. branch `ai-center/task-66-ornscore-p1-follow-up-disclosures-pr`, 시작 HEAD `1ff744f`(클린). **리셋/pull/머지/push·신규 npm·빌드 단계 추가 0**. 점수식·`stocks.json`·`direction` 무변경(표시/문구만). AI Center 4310·미리보기 3000 무중단(검증 prod 3267, 내 PID 36376만 taskkill). 외부 릴리스·main push 범위 외(운영자).
- Changed (코드 5 + 문서 4): `src/components/home/DisclosureSignalSection.tsx`(+`universeCount` prop·표시 정책 박스)·`src/app/page.tsx`(count 전달)·`src/components/DisclosureExplorer.tsx`(세그먼트 범위 버튼+캡션)·`src/app/pricing/page.tsx`(베타→Pro sky 콜아웃)·`src/app/terms/page.tsx`(현재 확정 정책 박스). 문서: `PROGRESS.md`·`docs/AI_HANDOFF.md`·`docs/legal-ai-commercial-readiness.md`(F항)·`docs/ornscore-spec-coverage.md`. `src/app/privacy/page.tsx`(모바일 스크롤 힌트).
- 5종 상태: [1][2][3][5] 구현 완료 · [4] 부분(현재 사실만 firm, 결제·환불 등은 법무 확정 필요로 미확정 유지). 자세한 검증/마커는 PROGRESS.md task 66 엔트리.
- Gate note: Playwright 미구성 → **운영자: 데스크톱/390px로 `/disclosures` 세그먼트 선택 상태·`/pricing` 콜아웃·`/privacy` 표 가로 스크롤+힌트·`/terms` 정책 박스 1회 확인 권장.**
- Residual / next: 약관 결제 조항 법무 확정·결제 게이트 미연결·가격 미확정(④/⑤). 운영자 390px 육안 게이트 → 외부 릴리스(별도 단계).

### Codex deploy — 2차 QA main 반영·운영 배포 완료 (2026-06-26)
- What: 사용자 "응 배포해줘" 승인에 따라 Task 60~63의 ORNSCORE 2차 QA 결과를 `main`에 반영하고 `origin/main`에 push. 시작 시 `origin/main`은 자동 데이터 갱신 `e8222f1 chore(data): daily refresh 2026-06-26T10:44Z`가 먼저 올라와 있었으므로, 해당 데이터 갱신을 보존해 작업 브랜치에 병합한 뒤 `main`을 fast-forward. 강제 push·히스토리 재작성 없음.
- Verification: `npx tsc --noEmit` 0, `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4, `npm run build` 0.
- Push/public: `git push origin main` 성공, `origin/main` = `2efe523`. Vercel 전파 후 `https://ornscore.com`에서 `/pricing`, `/privacy`, `/offline`, `/backtest`, `/stock/005380`, `/status` HTTP 200 및 2차 QA 마커 확인. `/manifest.webmanifest`도 HTTP 200 `application/manifest+json`.
- Next: 사용자가 실제 화면 체감 피드백을 주면 다음 개선 큐로 등록. 남은 큰 항목은 결제/구독 권한 연결, 데이터 소스 법무 확정, 관리자 인증/로그, service worker/아이콘 보강, 모바일 실브라우저 육안 QA.

### Task 63 — OrnScore 2차 QA 최종 검증 — 게이트 전수 통과·공개 전 릴리스 체크리스트 (2026-06-26, Claude)
- What: 방금 등록된 2차 QA 작업(Task 60 P0·Task 61 P1·Task 62 P2)이 모두 완료·정리됐는지 최종 검증하고 **공개 주소 최신화 전 운영자 확인 마커**를 문서화. **앱 소스 무수정**(산출물=PROGRESS·이 노트). branch `ai-center/task-63-ornscore-2-qa`, 시작·종료 HEAD `01df662`(Task 62 tip, 클린). 리셋/pull/머지/push·신규 npm·빌드 단계 추가 0. AI Center 4310·미리보기 3000 무중단(검증 prod 3256, 내 node PID 23936만 taskkill).
- 완료 감사(읽기 전용): `git log` 선형 — Task 60(`c3b6765`→`e8e5a34`)·Task 61(`071f759`/`c321f2a`/`9908805`/`3f75d23`→`d6bf701`)·Task 62(`56e1ee7`/`9f92756`/`3086863`/`09380a6`/`ea5ef24`→`01df662`)가 `b2fad41` 위에 P0→P1→P2로 선형 적층. `git status` 클린. `docs/ornscore-spec-coverage.md` §8 PART A~I 전 행 ①(미연결 결제·미확정 가격·SW 스텁·법무 결론은 명시 ④/⑤ 백로그). 예상 외 미커밋/누락 0.
- What passed(4 게이트 전수): **Gate1** `tsc --noEmit` 0 · **Gate2** `verify_metrics.py`(PYTHONUTF8=1) 138종목·오류 0·금칙어 0·**Metrics 2.4**(데이터 기준 `asOfBusinessDate=20260625`=**2026.06.25**) · **Gate3** `npm run build` 0(SSG 138 종목 + `/manifest.webmanifest`·`/offline`·`/admin/status`·`/api/report-data-issue` 포함 전 라우트) · **Gate4** 로컬 prod 3256 **13경로**(`/ /today /stocks /compare /stock/005380 /stock/032830 /disclosures /backtest /status /pricing /terms /privacy /watchlist`) **HTTP 200·치명 마커 0**. SSR 마커: `/`·`/status` Metrics 2.4+2026.06.25, `/pricing` 3티어·미확정·기능 비교·베타 무료, `/privacy` 국외이전 `<table>`, `/terms` 출시 전 확정 필요·청약철회, `/stock/*` 업종 휴리스틱 캡션, 하단 nav `grid-cols-5`, `/manifest.webmanifest`·`/offline` 200.
- Gate note(운영자 수동): Playwright 미구성 → 데스크톱/390px 실 브라우저 오버플로·콘솔 자동 게이트 부재(신규 npm/Playwright 범위 외) → **운영자 육안 1회 권장**. **AI 분석 동의 체크박스는 `StockTabs` 비기본 탭 클라 렌더라 초기 SSR 미노출** → 탭 열어 확인.
- 공개 전 운영자 확인 마커(배포 후 `https://ornscore.com/` 동일 노출): (1) `/`·`/status` 2026.06.25+Metrics 2.4 (2) `/pricing` 3티어·미확정 가격·알림 Pro 경계·비교표 (3) `/privacy` 국외이전 표 (4) 모바일 하단 5탭+관심 승격 (5) `/offline`+`/manifest.webmanifest` (6) `/stock/*` AI 동의 체크박스(요약 외 탭) (7) `/stock/*` 업종 캡션 (8) `/terms` 확정 필요 블록+`/backtest` 단일 고지·KPI 위험 줄.
- 실패/보류: 없음(전 게이트 통과). 보류는 의도된 ④/⑤ 백로그.
- Residual / next(범위 외·운영자): 결제·구독 게이트 미연결·가격 미확정(④/⑤)·SW 미등록(스텁)·512px 아이콘 미보강(④)·관리자 인증/배치 이력/수집 로그/신고 워크플로(④)·데이터 소스 법무 결론(⑤)·Playwright 모바일 게이트(⑤). **운영자: 육안 게이트 → `git push origin main`(FF) → Vercel 자동배포 → 8개 마커 공개 주소 확인.** Claude는 main 직접 push 안 함(CLAUDE.md 경계).

### Task 62 — OrnScore 2차 QA 설계서 PART F·G·H·I P2 마감 (2026-06-26, Claude)
- What: 기준 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART F(§18~19)·G(§20~22)·H(§23~24)·I [P2-1~P2-7] 반영. branch `ai-center/task-62-ornscore-2-qa-p2-ai-pwa`, 시작 HEAD `d6bf701`(Task 61 위, 클린). 리셋/pull/머지/push·신규 npm·빌드 단계 추가 0. 점수식·`stocks.json`·`backtest-result.json`·`direction`·크론 2종 무변경. AI Center 4310·미리보기 3000 무중단(검증 prod 3255, 내 PID 6104만 taskkill).
- Changed (코드 8 + 문서 4):
  - [P2-3/§18] `docs/data-source-commercial-risk.md` — §18 컬럼 형식 요약표(KRX·DART·Naver·yfinance·FDR) + 유료 기능→공식·안정 데이터 전환 로드맵 + 날짜/태스크 갱신. 법적 결론 [법무] 확인 필요 유지.
  - [P2-4/§19] `src/components/stock/SectorComparison.tsx` — "업종 분류는 오른스코어 내부 분류 기준이며 공식 KRX 업종과 다를 수 있습니다" 캡션. 산식 무변경.
  - [P2-5/§21] `src/app/privacy/page.tsx` — 국외 이전 ul→table(overflow-x-auto·min-w-[480px]·7열·4행 Supabase/Vercel/Resend/Anthropic).
  - [P2-6/§22] `src/components/AiAnalysisCard.tsx` — 실행 전 고지 강화 + 필수 동의 체크박스(미동의 시 실행 disabled). 비용/route 무변경.
  - [§20] `src/app/terms/page.tsx` — "출시 전 확정 필요 항목(초안·미확정)" 9항 블록(가격 0).
  - [P2-2] 신규 `api/report-data-issue/route.ts`(data_reports insert·graceful) + `components/status/ReportDataIssueForm.tsx`(인앱 폼) — mailto fallback 항상 유지.
  - [P2-1] 신규 `app/admin/status/page.tsx`(noindex·읽기전용: selfCheck·검증보류·결측·신고목록 ADMIN_ENABLED 시) + `docs/ornscore-admin-status-backlog.md`. `/status` 무변경.
  - [P2-6/§23] `components/MobileBottomNav.tsx` — 관심 MORE→PRIMARY(grid-cols-4→5).
  - [P2-7/§24] 신규 `app/manifest.ts`(standalone·icon.svg) + `app/offline/page.tsx`(설치 힌트). SW 미등록(스텁)·512px 아이콘 운영자 보강.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·Metrics 2.4 · `npm run build` 0(manifest.webmanifest·offline·admin/status 포함). 로컬 prod 3255 10경로 200·치명 마커 0 · SSR 신 문구 렌더 확인 · 변경 파일 금칙어 grep=기존 부정 고지만·U+FFFD 0.
- Gate note: Playwright 미구성 → **운영자: 데스크톱/390px로 하단 5탭(오버플로 0)·privacy 표 가로 스크롤·AI 동의 체크박스(StockTabs 탭 열어 확인)·`/stock/*` 업종 캡션·`/offline` 설치 힌트 1회 확인 권장.**
- Residual / next: 결제·구독 게이트 미연결·가격 미확정(④/⑤). service worker 미등록(스텁)·512px 마스커블 아이콘 미보강(④). 관리자 인증·배치 이력·수집 로그·신고 워크플로 백로그(④). 데이터 소스 법무 확정(⑤). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 61 — OrnScore 2차 QA 설계서 PART B~E·I P1 마감 (2026-06-26, Claude)
- What: 기준 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART B(§7~9)·C(§11~13)·D(§15)·E(§16~17)·I [P1-1~P1-5] 반영. branch `ai-center/task-61-ornscore-2-qa-p1-ux-cta`, 시작 HEAD `e8e5a34`(Task 60 위, 클린). 리셋/pull/머지/push·신규 npm·빌드 단계 추가 0. 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구/표시필터/한도값만). AI Center 4310·미리보기 3000 무중단(검증 prod 3254, 내 리스너 PID 30844만 taskkill).
- 시작 전 상태(예상과 다른 점): 플래너 라인번호 base `b2fad41` 기준 → Task 60 변경분과 어긋나 grep으로 현재 위치 재확인. 백테스트 §17 KPI 균형·"구성 예시"는 이미 충족 → 중복 0, 위험 비교 한 줄만 강화. `FEATURES`는 미소비 단일 출처(필드 추가 안전), `FREE_WATCHLIST/AI_LIMIT`은 pricing 표시 전용(게이트 미사용).
- Changed (코드 14파일):
  - [P1-1/2] `src/lib/limits.ts`(Free 한도 20→5·3→1), `src/lib/pricing.ts`(Free 알림="베타 무료 체험·정식 출시 시 Pro", Pro `includes` 알림 핵심 승격, `COMPARE_ROWS` 알림 free=`"베타 무료"`), `src/app/pricing/page.tsx`(Cell "베타 무료" sky 분기·범례·정직 한 줄), `src/lib/features.ts`(알림 2종 `betaFree:true,plannedPlan:"pro"` 마커만, status active 유지). **`api/cron/notify`·`api/cron/evaluate-alerts` 무변경(라이브 크론 보존)**.
  - [P1-3] `src/components/BeginnerReading.tsx` 카드 안 직접 `<NextActionButtons />` "다음으로 확인하기" CTA로 안내문 교체(STEP 카드·순서 보존).
  - [§11~13] `StocksExplorer.tsx`(프리셋 라벨)·`guide/metrics/page.tsx`·`metricReadings.ts`·`ScoreTooltip.tsx`·`today/page.tsx` "급등했지만 위험"/"고점 추격"/"시장의 관심" → 중립·확인 포인트.
  - [P1-4/§15] `src/components/DisclosureExplorer.tsx` "전체 시장/분석 대상만" 범위 토글(기본 전체 시장=기존 동작 보존, scoped 카운트 일관), `src/app/page.tsx` `pickTopSignals` universe 인자(홈 공시는 분석 대상만, 표시필터·`direction` 무변경).
  - [§16/17] `backtest/BacktestRiskNotice.tsx` 중복 고지 1줄 제거, `BacktestClient.tsx` KPI 그리드 아래 위험 비교 한 줄(MDD/Sharpe vs 벤치) 추가(수치 산출 무변경).
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0·금칙어 0·Metrics 2.4 · `npm run build` 0(SSG 138p+전 라우트) · 변경 14파일 금칙어 grep=부정 고지 2건만·U+FFFD 0 · 로컬 prod 3254 10경로 200·치명 마커 0 · SSR로 신 문구 렌더·구 공격적 문구 0 확인.
- Gate note: Playwright 미구성 → **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/pricing`(3티어·알림=Pro 경계·미확정 가격·비교표 가로 스크롤)·`/stocks`(첫 화면 밀도·재라벨)·`/stock/*`(카드 내 CTA 줄바꿈)·`/disclosures`(범위 토글)·`/backtest`(단일 고지·KPI 위험 줄) 가로 오버플로 0·콘솔 0 확인 권장.**
- Residual / next: 실 결제·구독 권한 게이트 미연결(④)·가격 미확정(④/⑤) 유지. 무료 알림은 베타 동안 실제 발송(크론 라이브) → 정식 출시 시 Pro 전환은 결제 연동과 함께. 남은 P2(§10 관리자·§21 표·§22 AI 모달·§23~24 모바일/PWA)는 별도 큐. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 60 — OrnScore 2차 QA 설계서 PART A·I P0 5종 마감 (2026-06-26, Claude)
- What: 기준 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART A(P0)·PART I [P0-1~P0-5]를 작은 단위로 반영. branch `ai-center/task-60-ornscore-2-qa-p0`, 시작 HEAD `b2fad41`(클린). 리셋/pull/머지/push·신규 npm·빌드 단계 추가 0. 점수식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시/문구만). AI Center 4310[PID 11160]·미리보기 3000 무중단(검증 prod 3253, 내 node PID 14504만 taskkill).
- 시작 전 상태 확인: P0-2(비교 빈 상태)·P0-4 홈 스냅샷 공시 카드("DART · 최신 200건 내")는 #36/#41에서 이미 완료 → 재구축 0, 실제 공백만 채움.
- Changed (코드 4파일, 표시/마크업/문구만):
  - [P0-1] `src/components/BeginnerReading.tsx` — "먼저 확인할 것" `<ol>/<li>`(자동 번호+내부 숫자 배지 → `1. 1` 중복)을 **STEP 카드**(`<a>` 카드+`STEP n` 단일 배지)로 교체. 번호 `STEP {i+1}` props 단일 출처, ol 자동 번호 제거. `CONFIRM_ORDER` 텍스트·href·`#basis`/`#disclosures`/`#financials` 앵커·읽기 순서 보존.
  - [P0-3] `src/components/BacktestClient.tsx` — "마지막 리밸런싱 **보유** {n}종목"→"…**구성 예시** {n}종목"("보유" 제거) + 캡션 spec 권장문 강화.
  - [P0-4] `src/components/home/DisclosureSignalSection.tsx` — 홈 "오늘 먼저 볼 공시 신호" 설명에 "DART 최신 200건 내" 기준 추가(스냅샷 카드와 일관). `MarketSnapshotCards.tsx` 무변경.
  - [P0-5] `src/components/StocksExplorer.tsx` — 상세 필터 버튼 카운트 배지를 라벨에서 분리(`ml-1.5`+라벨 `<span>` 래핑+`aria-label`)해 "▾1"로 안 읽히게. 모바일/데스크톱 변형은 브레이크포인트 배타. 필터 로직 무변경.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138/0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(SSG 138p+전 라우트) · 변경 4파일 금칙어 grep 0(부정 고지만). 로컬 prod 3253 7경로(`/ /stocks /compare /stock/005380 /stock/032830 /backtest /disclosures`) 200·치명 마커 0. SSR: `/stock/005380` STEP 1/2/3·`1. 1` 중복 0, `/backtest` "리밸런싱 보유" 0건·"구성 예시" 렌더, `/` 공시 기준 양쪽(섹션·스냅샷) 렌더.
- Gate note: Playwright 미구성 → **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/stock/*` STEP 카드 줄바꿈·`/compare` 빈 상태·`/stocks` 상세 필터 배지 간격·`/backtest` 구성 예시·가로 오버플로 0·콘솔 0 확인 권장.**
- Residual / next: PART B~H(무료/유료 경계·문구 중립화 §11~13·공시 전체 기간 §14·관리자 상태판 §10·약관 표 형식 §21·모바일 App-first/PWA §23~24)는 제품/데이터/법무 결정 동반(④/⑤) → 별도 큐. P1 티켓 중 표시 가능분([P1-3] 초보자 카드 CTA 등) 후속. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 55 — OrnScore 최종 검증·배포 — #38~#48 origin/main 반영 (2026-06-26, Claude)
- What: AI Dev Center 승인(2026-06-26 KST 메인 스레드, "작업 종료 후 배포까지")에 따라 #42~#48(동일 선형 체인의 #38~#41 포함) 완료 큐를 **origin/main에 fast-forward 반영하고 운영 배포**. 이 태스크 한정 원격 변경·운영 배포 승인. DB·env/키/시크릿·결제/인증 설정·히스토리 재작성·강제 푸시·일괄 삭제 비승인.
- 완료 게이트: "Last AI Center Event = Task 48 completed" + #42~#48 PROGRESS 엔트리·브랜치 존재 → 전부 completed·커밋됨(블로커 0).
- git: branch `ai-center/task-55-ornscore-final-verification-and-prod`, 작업트리 클린. `origin/main`=`a561e45`가 HEAD `85e48d9`의 조상 → **FF 가능**. `origin/main..HEAD` = #38~#48 커밋만(무관 0). 로컬 main `dad6e3b`는 origin/main 조상.
- 검증 통과: `tsc --noEmit` 0 · `verify_metrics.py` 138/0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(SSG 138p+전 라우트) · 로컬 prod 3408 19경로 200·치명 마커 0 · 릴리스 표면 데이터기준 2026.06.25·Metrics 2.4.
- 배포: `git merge --ff-only`로 #38~#48만 main 반영 → `git push origin main`(force 아님) → Vercel 자동배포 트리거.
- 운영 검증(`https://ornscore.com/`): 운영자 푸시 대기 — 로컬 `main`을 `4cac303`로 fast-forward 완료(검증 전부 통과). **Claude의 main 직접 push는 CLAUDE.md 경계("Claude는 main 직접 push 안 함")로 자동 모드 분류기가 차단** → 운영자가 PowerShell에서 `git push origin main` 실행 필요(또는 Bash 푸시 권한 부여). 푸시 시 origin/main `a561e45`→`4cac303` fast-forward(#38~#48 + 이 릴리스 노트), 머지 커밋·강제 푸시 없음. 푸시 후 Vercel 자동배포 트리거 → `https://ornscore.com/` 스모크(데이터기준 2026.06.25·Metrics 2.4) 확인 예정
- 잔여 리스크: Playwright 미구성(운영자 데스크톱/390px 육안 게이트 권장) · 결제·알림 미라이브 · 커버리지 138종목 · 가격 미확정 · Vercel 배포 전파는 운영자 대시보드 최종 확인 권장.

### Task 48 — OrnScore 독립 QA 리뷰 — 전 경로 QA 리포트·핸드오프 갱신 (2026-06-26, Claude)
- What: #38~#47 자동화가 끝난 베타 직전 상태를 **QA 전문가 관점**으로 점검(만든 사람 관점 아님). 산출물은 QA 리포트 + 진행/핸드오프 기록 — **앱 소스 무수정**. branch `ai-center/task-48-ornscore-qa`, 시작 HEAD `d3d92f6`(클린). 리셋/pull/머지/push·신규 npm 0.
- Changed/new: **신규 `docs/ornscore-qa-feedback.md`**(주 산출물) — Severity 분포(P0=0·P1=1·P2=2·P3=3·확인 완료 12), 각 이슈 경로/재현/기대/실제/제안, 운영자 육안 체크리스트(19경로·데스크톱+390px), 열린 질문 6, 잔여 리스크. `PROGRESS.md`·이 노트 갱신.
- 점검 경로(데스크톱 SSR): `/ /today /stocks /stock/005380 /stock/032830 /disclosures /backtest /compare /pricing /status /privacy /terms /watchlist /settings/notifications /about /universe /history /login /guide/metrics` → 19/19 HTTP 200·치명 마커 0. 뷰포트: 데스크톱 SSR+빌드 청크+소스. 390px = 클래스 가드 점검만(픽셀 미보장).
- 발견 요약: **P0 없음**. 데이터 기준 2026.06.25·Metrics 2.4 전 화면 동일(불일치 0). 금칙어 0·고지 8경로 전면·요금제 확정가 0·`<table>` 전부 overflow-x-auto·≥5열 고정 그리드 0. **P1**: Playwright 미구성 → 실 브라우저 시각 게이트 부재(운영자 육안 필요). **P2**: 공시 범위 표기 표면별 상이(7일 vs 90일, 다른 쿼리·문구 통합 제안) · `/today` 방문일 vs 데이터 기준일 위계. **P3**: `CLAUDE.md` 구 브랜드 "밸류맵 스톡" 잔존(앱은 "오른스코어" 일관) · 설계서 ③ 부분 항목(백로그 추적됨) · 공시 라이브 종료일 ≠ 가격 기준일(정상).
- What passed: `tsc --noEmit` 0 · `npm run build` 0(172p) · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · 로컬 prod 3403 19경로 200 · 신규 문서 Korean·링크 5개 전부 존재. `git diff`는 신규 문서·PROGRESS·이 노트만(앱 소스 0). 검증 prod node PID 14648만 정리, 4310·3000 무중단.
- Gate note: **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 QA 리포트 §7 체크리스트 19경로 육안 1회 권장**(특히 `/today` 날짜 위계·`/disclosures` 공시 범위 문구·`/stocks` 표형 가로 스크롤). 
- Residual / next: P1 운영자 육안 게이트 → P2-1 공시 범위 문구 통합·P2-2 today 날짜 위계·P3-1 CLAUDE.md 브랜드 정정(표시/문서 수정, 산식·데이터 무변경). 원격 갱신·main 머지·외부 릴리스·결제 연동 범위 외(운영자).

### Task 47 — OrnScore 상용화 고도화 2-E §10·§14·§15·§16·§18 베타 출시 체크리스트·커버리지 제한 노출·최종 QA (2026-06-26, Claude)
- What: 설계서 2 §10(커버리지)·§14(관리자)·§15(기술 고도화)·§16(로드맵)·§18(MVP 범위)를 기준으로 **베타 노출 가능 vs 준비 중** 상태를 구분하고 남은 의사결정/개발 항목을 추적 가능하게 정리. 앱에 바로 넣을 작은 상태 개선(커버리지 제한 1줄)은 반영, 큰 제품/기술 결정은 체크리스트로 분리. branch `ai-center/task-47-ornscore-2-e-qa`, 시작 HEAD `eb2123c`(클린). 리셋/pull/머지/push 없이 로컬 수정·검증·커밋까지만.
- Changed/new:
  - 신규 `docs/ornscore-beta-launch-checklist.md`(주 산출물) — (a)§16 로드맵 현재 위치(Phase 1 마무리→Phase 2 진입, 작업별 완료/진행/대기+코드 인용) (b)§18 MVP 11항목 노출 가능(8: 로그인·관심·오늘 후보·점수 근거·공시 신호+범위 고지·저장 필터·데이터 상태·투자 추천 아님 고지) vs 준비 중(3: 공시 알림·점수 급변 알림·Pro 결제, #45/#46 인용) (c)§10 단계(138→KOSPI200·KOSDAQ150·ETF→상위 500→전체)+§10.4 주의사항+제한 안내 문구안 (d)§14 관리자 MVP(읽기 전용 현황·`/status` selfCheck 근접) vs 후속(재수집·재계산·계정정지·결제이력) (e)§15+§4.4 모니터링 현재 점검됨(selfCheck: suspectCount·missingFinancials·metricsVersionMatch + verify_metrics 게이트) vs 미점검(수집 성공률·API 실패·발송률·전환 이벤트) (f)베타 공개 전 최종 확인(검증 게이트·잔여 리스크·운영자 확인).
  - 변경 `src/lib/dataStatus.ts` — `knownLimits` 맨 앞 "종목 커버리지" 항목(138종목·전체 아님·KOSPI200·KOSDAQ150·ETF부터 단계 확대·품질 검증 끝난 종목만 추가, `dataMetadata.count` 단일 참조). 기존 `/status` "알려진 제한" 리스트가 자동 렌더 — 신규 컴포넌트 0·산식/데이터/selfCheck 무변경·중립 톤.
  - 추적 갱신 `docs/ornscore-spec-coverage.md` §10·§14·§15·§16~18 행 Task 47 + 체크리스트 교차참조(상태 ④ 유지).
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(SSG 172p) · 변경 파일 금칙어 grep 0(부정 고지 "매수·매도 추천이 아닙니다"만 매치) · 로컬 prod 3402 14경로 200·치명 마커 0 · `/status` SSR "종목 커버리지 — 현재 분석 대상은 138종목…" 렌더 확인. 검증 prod node PID만 taskkill, 4310·3000 무중단.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용(curl+SSR grep+build 대체). **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/status` 알려진 제한 "종목 커버리지" 줄바꿈·오버플로 0·콘솔 0 확인 권장.**
- Residual / next(④): (1) 결제·구독 권한 게이트 미연결. (2) 가격 미확정(④/⑤). (3) 알림 실 발송 미라이브. (4) 관리자 상태판·오류 신고 영속 저장 미구현. (5) 커버리지 138종목 → §10 단계적 확대+품질 표시. (6) 데이터 소스·결제 약관 [법무] 확정(⑤). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 46 — OrnScore 상용화 고도화 2-D §11·§13·§19 무료/Pro/Premium 경계·미확정 가격 안전 정리 (2026-06-26, Claude)
- What: 설계서 2 §11(유료화 구조)·§13(법적 리스크)·§19(추천 요금제)를 기준으로 **실제 결제 연결 없이** 요금제 정보 구조·기능 경계·전환 CTA·고지를 안전하게 정리. Free/Pro/Premium 과장 금지, 미확정 가격을 확정처럼 쓰지 않음. branch `ai-center/task-46-ornscore-2-d-pro-premium-ux`, 시작 HEAD `849b995`(클린). 리셋/pull/머지/push 없이 로컬 수정·검증·커밋까지만.
- Changed/new:
  - 신규 `src/lib/pricing.ts` — 요금제 단일 출처: `PLANS`(free=active·pro/premium=planned, `priceConfirmed:false`, priceLabel은 "검토 중 · 미확정 (예상 월 9,900~14,900원, 확정 아님)" / "…월 29,000원대, 확정 아님" 형태로만 — 단일 확정 금액 금지), `COMPARE_ROWS`(✓/—/"준비 중"). Free 한도는 `limits.ts` 재사용.
  - 변경 `src/lib/features.ts` — `premiumPlan:{status:"planned"}` + Premium 미구현 7항목 `plan:"premium",status:"planned"` 태그. 라이브 무료 알림 2종(watchlistDisclosureAlert·conditionAlert)은 그대로(Free/유료 경계 정직).
  - 변경 `src/app/pricing/page.tsx` — 2티어→**3티어 카드**(Pro·Premium "출시 예정·준비 중" 배지+미확정 가격) + **Free/Pro/Premium 기능 비교표**(overflow-x-auto·min-w-[420px]·390px 가드) + §11 "왜 Pro/Premium인가" 가치 한 줄(시간 절약·변화 알림·기록·리서치 보조, 수익률/매수·매도 0). WaitlistForm은 planned 티어에만. 하단 §13.2 공통 고지 + "가격·정책 검토 중·출시 전 확정·공지" 1줄. `metadata.description` Premium 출시 예정.
  - `terms/page.tsx`는 가격 무표기("출시 예정·초안") 유지 — 변경 없음(검증만).
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(`/pricing` 1.15 kB) · 변경 3파일 금칙어 grep 0 · 로컬 prod 3401 `/pricing`·`/terms`·`/settings/notifications`·`/watchlist` 200·에러 마커 0. `/pricing` SSR "출시 예정 · 준비 중"·"검토 중 · 미확정"·"가격 미확정"·"기능 비교"·"준비 중"·"최종 투자 판단과 책임은 사용자 본인"·"매수·매도 추천이 아닙니다" 렌더. `/terms` 가격 수치 0건. 검증 prod node PID 8676만 taskkill, 4310[PID 11160] 무중단·3000 미기동 상태 그대로.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용. **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/pricing` 확인 권장** — 3카드 3↔1열·기능 비교표 가로 스크롤(390px)·미확정 배지·오버플로 0·콘솔 0.
- Residual / next(④): (1) 실제 결제·구독 권한 게이트 미연결 — Pro/Premium은 정보구조·대기 신청만(발송/과금 0). (2) 가격 전부 미확정(④/⑤) — 출시 전 법무·사업 확정·공지(범위 외). (3) Premium 비교표는 경계 표시만, 권한별 게이팅은 결제 라이브 시. `docs/ornscore-spec-coverage.md` §11·§13·§19 교차참조. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 45 — OrnScore 상용화 고도화 2-C §7 알림 설정 UX·무해한 알림 MVP (2026-06-26, Claude)
- What: 설계서 2 §7(알림 종류/채널/설정/예시)·§5.4(점수 급변)·§6.5(공시 알림)을 **실 발송·외부 채널 없이** 사용자가 알림 종류·설정 개념을 이해하는 안전한 MVP로 구현. branch `ai-center/task-45-ornscore-2-c-ux-mvp`, 시작 HEAD `d110be6`(클린). 리셋/pull/머지/push 없이 로컬 수정·검증·커밋까지만.
- Changed/new:
  - 신규 `src/lib/alertCatalog.ts`(순수, §7.1 알림 9종 단일 소스: 라이브 2종+미리보기 7종), `src/lib/alertPrefs.ts`(미리보기 토글 **localStorage 전용·무발송**, `ornscore_alert_prefs`+CustomEvent), `src/components/notifications/{AlertTypeCatalog(client),AlertExampleCards(순수),NotificationChannels(순수)}.tsx`.
  - 변경 `src/app/settings/notifications/page.tsx`: `redirect('/login')` 제거(비로그인도 개념 열람) → 실 발송 설정만 로그인 CTA 뒤로. 상단 MVP 상태 배너, 예시 데이터 서버사이드(공시=recent-signals 실신호·점수 급변=`getScoreChangesBatch` 실변화/폴백·거래활성도=`flowStats.ratio` 실값). 순서: 상태 고지→실 발송/로그인 CTA→종류 카탈로그→채널→예시→"알림 받으려면".
  - 변경 `src/components/WatchlistClient.tsx`: 내 현황에 `/settings/notifications` 중립 CTA 1줄(압박 문구 없음).
  - **라이브 cron 2종(`api/cron/notify`·`api/cron/evaluate-alerts`) 무변경**(git diff 0) — 기존 발송 파이프라인 보존.
- What passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(`/settings/notifications` 6.48 kB·138p) · 로컬 prod 3399 `/settings/notifications`(비로그인)·`/watchlist` 200·치명오류 0(`Hydration`은 Next 공통 런타임 문자열·양 페이지 동일·실오류 아님)·SSR 알림 종류/채널/예시 카피 렌더(준비 중 24·예시 12)·CTA·카탈로그 라벨 빌드 청크 존재·변경파일 금칙어 grep 0(부정 고지 제외). 검증 prod node PID 9152만 taskkill, 3000·4310 무중단.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용(curl+SSR grep+청크 grep+build 대체). **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/settings/notifications`(비로그인/로그인)·`/watchlist` 확인 권장** — 상태 배너·라이브/준비 중 배지·미리보기 토글·채널 카드·예시 카드·CTA·오버플로 0·콘솔 0.
- Residual / next(④ 후속): (1) 미리보기 토글은 localStorage 한정·의도적 무발송 → 실 발송 시 종류별 Supabase 스키마+cron+임계 튜닝 필요. (2) 웹/텔레그램/카카오/앱푸시 채널 미연결. (3) 점수 급변 예시는 daily_scores 미축적 시 형식 예시 폴백(예시 태그·고지 명시). `docs/ornscore-spec-coverage.md` §7·§5.4·§6.5 교차참조. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 44 리뷰 수정 — 저장 필터 충족 수 4지표 하위점수 누락 (2026-06-26, Claude)
- 리뷰 FAIL: /watchlist "저장한 필터"의 "현재 조건 충족 N개"가 `matchConfig.matchesConfig`로 계산되는데 이 함수·`StockForMatch`가 저장 필터에 흔한 `momentumMin/flowMin/valueMin/volMin`(추세·거래활성도·밸류·위험조정 하한)을 무시 → 충족 수 과대(최대 ~10배)·옆 `describeConfig` 조건 문구와 모순.
- 수정(4파일): `src/lib/matchConfig.ts` — `StockForMatch`에 `momentum/flow/value/vol:number` 추가 + `matchesConfig`에 4분기(`(c.xxxMin ?? 0) > 0 && s.xxx < ...`, StocksExplorer와 동일·0이면 비제약). `src/app/watchlist/page.tsx`·`src/app/api/cron/evaluate-alerts/route.ts` — `realStockPool→StockForMatch` 매핑에 4필드 추가(두 곳 동일). cron 조건 알림도 같은 하한을 정확히 평가.
- 검증: `npx tsc --noEmit` 0 · `verify_metrics.py` 138/0오류 · `npm run build` 0(`/watchlist` 8.4 kB). 신규 npm 0, 점수식·데이터 무변경, 투자 조언성 표현 신규 0.

### Task 44 — OrnScore 상용화 고도화 2-B §8 개인화 대시보드·저장 필터·관심종목 UX (2026-06-26, Claude)
- Preview/branch: branch `ai-center/task-44-ornscore-2-b-ux`. 시작 HEAD `45131a4`(작업트리 클린) 위 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단. 로컬 검증 prod `127.0.0.1:**3391**`(내 리스너 node PID 22016만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 목표: 설계서 2 §8 개인화 대시보드(8.1 위젯·8.2 관심·8.3 저장 필터)·§12 리텐션을 기존 로컬 저장 구조 안에서 **재방문 개인 출발점**으로. 큰 계정/서버 위젯은 빈 상태+후속 범위로 분리. §8.3 저장 필터·조건 알림은 #36 기구현 → 재구축 안 함(가치 노출만). 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시 파생만), 신규 npm 0, 투자 조언성 표현 신규 생성 0.
- What changed (수정 2파일, 표시 파생·문구만):
  - **`src/components/WatchlistClient.tsx`**: (1) 맨 위 **"내 현황" strip** — 관심 N·최근 본 N·저장 필터 N 카운트 + 관심 종목 변화 요약(`tickerToDelta` 파생: 오른 M·내린 K·변동 없음 J, 중립·"매수·매도 추천이 아닙니다" 캡션); 세 영역 모두 비면 단일 "다시 방문했을 때 보는 개인 출발점" 온보딩으로 collapse(390px: flex-wrap·min-w-[90px]·break-words/keep·tabular-nums). (2) **"저장한 필터" 신규 섹션** — `listSavedSearches()` 구독(saved-searches-changed·storage), `matchConfig.matchesConfig`로 `matchPool` 대비 실시간 "현재 조건 충족 N개" + `describeConfig` 자연어 요약, 행은 `/stocks` 링크(전체 config 자동 적용 미구현→후속), 빈 상태는 저장 필터 가치 설명+`/stocks` CTA. (3) **섹션 순서**: 현황 요약→관심 종목→저장한 필터→최근 본 종목, 각 빈 상태가 다음 행동 명시. 기존 관심 행·간단/분석 토글·신호 배지·최근 본 로직 보존.
  - **`src/app/watchlist/page.tsx`**: `matchPool: StockForMatch[]`를 알림 cron(`evaluate-alerts/route.ts`)과 동일 매핑으로 `realStockPool`에서 만들어 전달. 기존 allStocks·신호·델타·로그인 분기 보존, 신규 데이터 소스 0.
  - 플래너 대비: `getAllStocks()`(MockStock)에 `eps`/`market` 없어 tsc 실패 → 그 필드를 가진 `RealStock`(`realStockPool`)로 매핑(cron 동일) — matchesConfig의 excludeLoss(eps)·market 분기 정확 동작.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p·`/watchlist` 8.29 kB, exit 0) · 변경 2파일 금지표현 grep 0(유일 매치는 부정문 "매수·매도 추천이 **아닙니다**" 2곳). 로컬 prod(3391) `/watchlist`·`/stocks` 200·에러 마커 0(유일 매치는 React `suppressHydrationWarning`). 새 섹션은 클라 렌더라 빌드 청크(`app/watchlist/page-*.js`)에 신규 문자열 포함 확인.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용(curl+SSR grep+빌드 청크 grep+build 대체). **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/watchlist` 확인 권장** — 현황 strip 3칸·관심 변화 요약·저장 필터 충족 수/조건 요약·빈 상태(관심/저장/최근)·오버플로우 0·콘솔 0.
- Residual / next(후속 범위 — 계정/서버 스키마 결정 필요, 이번 미구현): §8.1 서버 백엔드 위젯(관심종목 공시·알림 위젯·업종별 Top5·거래활성도 급증·오늘의 요약 리포트), §8.2 그룹 분류·CSV 다운로드, §8.4 분석 메모(종목별 개인 메모), 최근 본 종목 기기 간 동기화 → `docs/ornscore-spec-coverage.md` §8 행 교차참조. 저장 필터 충족 수는 비로그인 시 클라/로컬 기준, 행 클릭 시 전체 config 자동 적용 라우팅 미구현(현재 `/stocks` 이동만). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 43 — OrnScore 상용화 고도화 §5 점수 산출 근거·설명 레이어 강화 (2026-06-26, Claude)
- Preview/branch: branch `ai-center/task-43-ornscore-2-a`. 시작 HEAD `993551c`(작업트리 클린) 위 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310[PID 11160]·미리보기 3000 무중단. 로컬 검증 prod `127.0.0.1:**3344**`(내 리스너 node PID 27972만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 목표: 설계서 2 §5.1~5.2(종합 점수 근거 보기·지표별 상세) — 종목 상세에서 "왜 이 점수가 나왔는지"를 더 잘 보이게. 점수 계산식(`score.ts`/`metrics.ts`/`sector.ts`)·`stocks.json`·`backtest-result.json`·`direction` 무변경(표시 파생만), 신규 npm 0, 투자 조언성 표현 신규 생성 0.
- What changed (신규 2 + 수정 4파일):
  - **신규 `src/lib/scoreBasis.ts`(순수)**: 4지표+실데이터(`returns`·`flowStats.ratio`·`per/pbr/roe`·`sectorValueScore`·`volStats`)→`{composite, parts[]}`. part = score·weightPct 25·`contributionPts=round(score*0.25)`·rank·topPct·factors[]·`reading`(metricReadings 재사용)·missingNote?·extraNote?. 추세=존재하는 r1m/r3m/r6m만 "+x.x%"(전무 시 missingNote)·거래활성도=flowStats.ratio "x.xx배·거래 늘어남/비슷/줄어듦"(실데이터)·밸류=PER/PBR/ROE+업종 상대(score>=0일 때만, 표본<4 extraNote)·위험조정=변동성/낙폭/Sharpe 중 존재값만. composite=`compositeOf` 재사용.
  - **신규 `src/components/stock/ScoreBasisBreakdown.tsx`(서버)**: "종합 N점 = 4지표 동일 가중(각 25%) 평균"+점수≠순위 1줄+지표별(점수/막대/기여 ≈N점/상대순위/factor 칩/강점·주의/결측 안내)+하단 고지·지표 가이드 링크. 순수 Tailwind, 390px 가드(grid-cols-1 sm:grid-cols-2·flex-wrap·min-w-0·break-words).
  - **`src/app/stock/[ticker]/page.tsx`**: "점수 근거" 탭 단순 카드→`ScoreBasisBreakdown` 대체(`buildScoreBasis`에 rankOf/topPctOf·sectorValue·returns·volStats·flowStats 전달). dataWarnings·ScoreHistoryChart·StockEventTimeline·AiAnalysisCard 보존. 미사용 ScoreTooltip import 제거.
  - **`src/lib/mockData.ts`**: `MockStock.flowStats?` 타입 추가(타입 안전 접근, 런타임값은 realStockPool 제공).
  - **`src/components/ScoreHistoryChart.tsx`**: 빈 상태 "추후 축적 후 제공·10회+ 추세 그래프" 명확화(데이터 있을 때 로직 무변경).
  - **`src/app/guide/metrics/page.tsx`**: "읽기 전 검토 포인트"에 "종합점수 = 4지표 각 25% 동일 가중 평균" 항목 추가.
- 플래너 대비 개선: 거래활성도 원시 거래대금 부재 가정 → 실제 `flowStats.ratio`가 138종목 전부 채워져 있고(0.14~2.81) 점수 산식 입력임을 확인 → 지어내지 않고 실데이터 ratio를 factor로 정직하게 노출(결측 시 missingNote 폴백 유지).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p·`/stock/[ticker]` 14.1 kB, exit 0) · 변경 6파일 금지표현 grep 0(유일 매치는 부정문 "매수·매도 추천이 아닌"). 로컬 prod(3344) `/stock/005380`·`/stock/032830`·`/guide/metrics` 200·에러 마커 0, SSR "종합 점수 근거 보기"·"4지표를 동일 가중(각 25%)"·"종합 기여 ≈"·1/3/6개월 수익률·"최근 5일/20일 평균 거래대금 0.88배 · 거래 줄어듦"·"점수와 순위는 다릅니다"·030200(피어<4) "업종 내 상대 밸류는 추후 데이터 축적 후 제공" 렌더.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용(curl+SSR grep+build 대체). **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/stock/*` 점수 근거 탭 확인 권장** — 근거 카드 2↔1열·factor 칩 줄바꿈·기여/순위·결측 안내(030200)·오버플로우 0·콘솔 0.
- Residual / next: §5.3 점수 변화 시계열 축적·§5.4 급변 알림 라이브화는 ④ 후속(cron 골격 존재, 데이터·운영 결정 필요). 거래활성도 절대 거래대금(원 단위)은 단위 불명확으로 미노출(ratio만). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 42 — OrnScore 설계서 전체 커버리지 감사 — 추적 문서·남은 백로그 우선순위 (2026-06-26, Claude)
- Preview/branch: branch `ai-center/task-42-ornscore`. 시작 HEAD `e9c3dad`(작업트리 클린) 위에 쌓음 — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만. AI Center 4310·미리보기 3000 무중단(이번 작업 화면 변경 0 → 보조 포트 미기동). main 머지·외부 릴리스 범위 외(운영자).
- 목표: 사용자가 준 7개 설계서를 전수 정독, 현재 코드+#14~#41 결과와 대조해 **한 문서에서 추적**. 문서 작업이 주 목적 — 앱 UI 무변경(작은 오탈자 외). 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경, 신규 npm 0, 투자 조언성 표현 신규 생성 0.
- What changed: **문서 1파일 신규** `docs/ornscore-spec-coverage.md` — 7개 설계서(ORNSCORE_1st_commercial_stabilization·commercialization_upgrade·data_trust_badge·design_improvement·home_redesign·stock_detail_conclusion_card·stock_filter_ui) 전 항목을 5상태(①완료 ②#38~#41 ③남음·소 ④큰 제품결정 ⑤법무·사업)로 분류·소유자([개발]/[제품]/[법무·사업]) 표기·코드 경로/작업 번호 인용·근거 문서 교차링크. PROGRESS.md·이 노트 갱신.
- 설계서 원문 발견: 7개 .md 모두 데스크톱(`C:\Users\dongy\OneDrive\바탕 화면\*.md`)에 존재 → 이번에 전수 정독. 과거 #33~#37 "PART D~P 원문 미확보"는 당시 PDF만 있던 상태였음을 문서에 정정 메모. 레포 내부엔 없어 커밋 대상 아님(커버리지 문서가 추적 대행).
- 대조 결과: 설계서 1(1차안정화)·3(데이터신뢰)·4(디자인 Phase 1~7)·5(홈)·6(상세 결론카드)·7(탐색필터) 핵심은 #14~#41에서 대부분 ① 완료 → 중복 구현 금지. 남은 고도화는 대부분 **설계서 2(상용화 고도화)**: 관리자 데이터 상태판·오류 신고 영속 저장·결제/구독·알림 라이브·점수 히스토리 시계열·공시 전체 기간 수집·공시 중요도/반응 통계·생존편향 실해결·커버리지 확대·Premium 3티어 = ④, 데이터 소스 약관·결제 약관·실 브라우저 모바일 게이트 = ⑤.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p, exit 0) · 신규 문서 금지표현 grep 0. 화면 변경 0 → 로컬 서버 렌더 체크 생략.
- Residual / next: 다음 자동화 큐는 커버리지 문서 **A절(③)** 권장 — 탐색 필터 감각화 마감(질문형 프리셋 카드화·조건 요약 자연어·예상 결과 수) → 데이터 신뢰 배지 5단계 마감·인라인 TrustBar → 산식 버전 불일치 빌드 게이트 → 오류 신고 진입점 확대 → 로딩 스켈레톤 → 압축 보기·모바일 바텀시트. B절(④)·C절(⑤)은 제품/법무 결정 후 분리 착수. 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 41 — OrnScore 1차 안정화 후속 D — 비교 최근 본 종목·공시 범위 고지·업종 밸류 한계 표시 (2026-06-25, Claude)
- Preview/branch: branch `ai-center/task-41-ornscore-1-d-ux`. 시작 HEAD `a18dad1`(= Task 33~40 위) — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만(작업트리 클린). AI Center 4310[PID 6008]·미리보기 3000 무중단. 로컬 검증 prod `127.0.0.1:**3277**`(내 리스너 node PID 30636만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 목표: 작업범위 D — 상용화 전 눈에 보이는 불안 요소·확인 공백 축소(신규 기능 최소). 점수 계산식(`sectorValueScore`)·`stocks.json`·`backtest-result.json`·`direction` 무변경, 신규 npm 0, 투자 조언성 표현 신규 생성 0(후보·탐색·확인·참고 정보·매수·매도 추천 아님 유지).
- What changed (코드 5파일, 표시·문구·공유 리더만):
  - **(2) 신규 `src/lib/recentViews.ts`**: `RecentViewTracker`가 쓰는 `ornscore_recent_views`(레거시 폴백) 읽는 `getRecentViews()` 단일 소스. `WatchlistClient.tsx` 인라인 `readRecent()` → 이 리더로 교체(바이트 동일). `CompareClient.tsx` 시작 화면(`stocks.length<2`)에 **"최근 본 종목에서 추가"** 첫 추가 경로 신설 — 실제 방문 기록만(`stockMap` 매핑·담은 종목 제외·기록 1개+ 일 때만, 가짜 칩 없음), `recent-views-changed`·`storage` 구독, 44px 칩. 순서: 최근 본→추천 세트→오늘 Top5→관심→검색→업종.
  - **(3) `StockDisclosures.tsx`**: `?days=90&limit=20`→`slice(0,10)` 표시인데 헤더는 "최근 90일"만 보였음 → **상시 캡션** "최근 90일 내 최신 공시 일부입니다(최대 20건 수집 · 10건 표시) · 전체 공시 이력이 아닙니다." 추가(중립 톤). API·`direction`·카운트 무변경.
  - **(4) `src/app/stock/[ticker]/page.tsx`(`sectorValue.score>=0`)**: 동종 피어<10이면 cyan 강조 대신 **중립 zinc 톤 + "표본 작음 · 참고만"** 캡션, 피어≥10이면 기존 cyan 강조 유지. 임계/문구 `dataStatus.knownLimits`("밸류 업종 기준") 정렬. `sectorValueScore` 산식·`peers<4` 미제공 분기 무변경(표시만).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p, exit 0) · 변경 5파일 금지표현 grep 0 · 로컬 prod(3277) `/compare`·`/disclosures`·`/stock/005380`·`/stock/032830`·`/watchlist` 200·에러 마커 0. SSR: **005380(자동차·피어<10) "표본 작음 · 참고만" 중립 톤**, **032830(보험·피어≥10) cyan 강조 유지**(두 분기 확인). 클라 렌더 문자열(최근 본 종목·공시 캡션)은 빌드 청크(`app/compare/page-*.js`·`app/stock/[ticker]/page-*.js`)에 포함 확인.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용(curl+SSR grep+빌드 청크 grep+build 대체). `/compare` 시작 화면·최근 본 종목 칩과 공시 캡션은 클라 렌더라 SSR HTML 미노출. **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 확인 권장** — `/compare` 최근 본 종목 칩(줄바꿈·44px·실제 기록 있을 때만)·`/stock` 공시 범위 캡션·업종 밸류 저표본 중립 톤·오버플로우 0·콘솔 0.
- Residual / next(후속 큰 데이터 작업 — 이번 미시도): **KRX 공식 업종코드 매핑**(업종 밸류 피어 표본 확대 → 강조 표시 종목 증가), **공시 전체 기간 수집**(현재 종목 상세 90일·20건 수집/10건 표시·/disclosures 200건 상한 → 전체 기간 DART 파이프라인 필요), **최근 본 종목 기기 간 동기화**(현재 localStorage 로컬 → 계정 기준 크로스 디바이스). 데이터 파이프라인 확장은 시도하지 않음(설계서 작업범위 D 5항). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 40 — OrnScore 1차 안정화 후속 C — /status 운영 상태판 보강(알려진 제한·자동 점검·오류 신고 단일화) (2026-06-25, Claude)
- Preview/branch: branch `ai-center/task-40-ornscore-1-c-mvp`. 시작 HEAD `a561e45`(= Task 33~39 머지 상태) — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만(작업트리 클린). AI Center 4310[PID 6008]·미리보기 3000 무중단. 로컬 검증 prod `127.0.0.1:**3262**`(내 리스너 node PID 26360만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 목표: 작업범위 C — 운영자가 `/status`만 봐도 현재 데이터/산식/제한/오류 신고 흐름을 이해하게 보강, 사용자 오류 신고 진입점 명확화. 신규 기능·데이터 구조 변경 아님. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경, 신규 npm 0, 투자 조언성/거짓 확정 표현 신규 생성 0.
- What changed (코드 5파일, 표시·문구·파생 데이터만):
  - **`src/lib/dataStatus.ts`(단일 소스 확장)**: `knownLimits`(공시 200건·백테스트 시뮬/생존편향·밸류 표본 부족→전체 풀·업종 휴리스틱·검증 보류 Top 제외 — 기존 `limits.disclosure`/`limits.backtest` 문자열 모듈 상수로 재사용), `selfCheck`(realStockPool 실측: 검증 보류 수=`isSuspect`·결측 수=`missingFinancials`·산식 일치=vs `EXPECTED_METRICS_VERSION`), `reportEmail`·`dataIssueReportFields`·`buildDataIssueMailto({subject?,prefill})`(본문 실제 `\n`, 기준일·산식 자동 prefill).
  - **`src/app/status/page.tsx`**: 스냅샷에 점수 계산 시각·공시 라이브 조회·산식 일치 라인 추가, "알려진 제한"·"최근 자동 점검 요약" 섹션 신설(점검 이력 보관/관리자 대시보드/수동 재수집 후속 캡션), 상단 인페이지 목차(앵커 칩)·`scroll-mt-20`·`break-words`로 모바일 가독성. 기존 도메인 상태·데이터 소스 보존. 인라인 mailto → `ReportDataIssue`로 대체.
  - **신규 `src/components/status/ReportDataIssue.tsx`(서버)**: 44px mailto 버튼 + 화면에 보이는 "신고 시 포함할 정보" 체크리스트(`dataIssueReportFields`). `id="report"`로 `/status#report` canonical 앵커.
  - **`src/app/about/page.tsx`**: "데이터 오류" 문의를 `/status#report`로 안내(기능 제안·협업은 메일 유지).
  - **`src/app/layout.tsx`**: 푸터에 "오류 신고"(`/status#report`) 링크 추가.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p·`/status` 프리렌더, exit 0) · 변경 5파일 금지표현 grep 0 · 로컬 prod(3262) `/status`·`/about` 200·에러 마커 0, SSR "알려진 제한"·"최근 자동 점검 요약"·체크리스트·`id="report"`·검증 보류 종목·산식 일치 렌더·mailto %0A 줄바꿈·`/about` 신고 링크 확인.
- Gate note: Playwright 미구성 → 자동 DESKTOP/390px 게이트 미가용(curl+SSR grep+build 대체). **운영자: 3000 재빌드·재기동 후 데스크톱/390px로 `/status` 확인 권장** — 목차 칩 줄바꿈·알려진 제한/자동 점검 카드 2↔3열·신고 체크리스트·44px 버튼·오버플로우 0·콘솔 0.
- Residual / next: 오류 신고 **메일 전용**(영속 저장 미추가). **후속 분리**: 오류 신고 저장소 + 관리자 대시보드 + 수동 재수집 트리거(설계서 §3.3-6/7·§45/46, `docs/legal-ai-commercial-readiness.md`). `selfCheck`는 배포 시점 스냅샷(점검 이력 시계열 보관 없음 — 후속). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).

### Task 39 — OrnScore 1차 안정화 후속 B — 데이터 소스 리스크 체크리스트(법무/개발 분리·갱신 경로 정리) (2026-06-25, Claude)
- Preview/branch: branch `ai-center/task-39-ornscore-1-b`. 시작 HEAD `a561e45`(= Task 33~38 머지 상태) — **리셋/pull/머지/push 없이** 로컬 수정·검증·커밋까지만(작업트리 클린). AI Center 4310·미리보기 3000 무중단(이번 작업은 보조 포트 서버 미기동 — 화면 변경 0).
- 목표: 작업범위 B — 데이터 출처 관련 잔여 리스크를 **한 문서에서 추적 가능**하게, **법무 최종 판단 항목과 개발자 처리 항목을 분리**. 신규 기능·데이터 구조 변경 아님, 신규 npm 0, 사실과 다른 확정 표현 신규 생성 0.
- What changed: **문서 1파일만** — `docs/data-source-commercial-risk.md` 재구성(코드/데이터 동작 무변경). (A) 표시 데이터별 출처·갱신 경로 표(`/status`·`DATA_SOURCES`·`domainStatuses` ↔ 실제 파이프라인) / (B) 출처별 법무 검토 약관·라이선스 질문(소유자 **[법무]**, 결론 확인 필요) / (C) 대체 출처 후보·전환 작업(소유자 **[개발]**) / (D) 결제 전 데이터 출처 한정 고지 초안(`legal-ai-commercial-readiness.md` 교차링크) / 추적 체크리스트(설계서 §41, **[법무]/[개발]**+상태) / 코드↔표기 정합성 부록.
- 핵심 발견(KRX↔FinanceDataReader 정합성): 실제 일일 자동 갱신은 **FinanceDataReader 기반 `fetch_prices.py`**(`daily-data.yml` cron `0 8 * * 1-5`+`workflow_dispatch`)인데 직전 표가 인용한 **`scripts/run_real.py`는 현재 저장소에 없음**. yfinance·Naver 스크래핑은 `fetch_prices.py`가 아니라 **`fetch_stock_data.py`(시드/수동)**에 있음. `/status`("FinanceDataReader")와 `DATA_SOURCES`/`domainStatuses`("KRX") 명칭 불일치 = **사실 오류 아님(FDR가 KRX 등을 내부 사용) → 코드 미변경, 문서에 확인 필요로 기록**.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG, exit 0) · 변경 문서 금지표현 grep 0. 화면 문구 변경 0 → 로컬 서버 렌더 체크 생략(보조 포트 미기동).
- Residual / next: **[법무]** 출처별 약관 원문 대조·Naver 비공식 수집 대체 결정·KRX 상용 시세 라이선스. **[개발]** 앱 내 관리자 수동 재수집 트리거(현재 GitHub Actions 수동 버튼만)·워크플로 수집 실패 알림(현재 비-blocking)·출처 명칭 일원화. 원격 갱신·main 머지·외부 릴리스는 범위 밖(운영자).

### Task 38 — OrnScore 1차 상용화 안정화 후속 A — 데스크톱/390px 시각 QA 스윕 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-38-ornscore-1-a-qa-ui`**. 시작 HEAD `a561e45`(= Task 33~37이 위에 쌓인 머지 상태) — **리셋/pull/머지/push 없이** 로컬 QA만(작업트리 클린). 로컬 검증 prod `127.0.0.1:**3258**`(AI Center 4310[PID 6008] 무중단·3000 운영자 미기동 상태 그대로, 내 리스너 node PID 28512만 taskkill). 원격 갱신·main 머지·외부 릴리스 범위 외(운영자).
- 목표: 작업범위 A — 1차 안정화(#33~#37) 이후 주요 화면을 실제 사용자 눈높이로 재확인, 가로 넘침·버튼/배지 붙음·카드 붕괴·텍스트 겹침·콘솔/hydration 오류·죽은 링크·새 투자 추천 오해 문구를 찾아 **작은 표시 수정만** 적용. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경, 신규 npm 0.
- QA 범위: 검증 12경로 `/ /today /stocks /stock/005380 /stock/032830 /disclosures /backtest /compare /pricing /status /privacy /terms`(005380 현대차·032830 삼성생명, 둘 다 비-suspect 정상 경로).
- What changed: **코드 변경 0**. 12경로 전수 점검 결과 데스크톱/390px에서 치명적 표시 오류·붙음·붕괴·겹침·콘솔/hydration·죽은 링크·새 추천 오해 문구가 발견되지 않음. Task #33~#37이 해당 화면 UI 기본기(번호 중복·CTA 그룹·배지 분리·점수≠순위·공시 카드 구조·메뉴 단순화·요금제 경계·법무 고지)를 이미 정리해 작은 수정으로 고칠 잔여 항목이 없어 **없는 문제를 만들지 않기 위해 임의 수정 안 함**. 이번 커밋은 QA 결과 문서화(PROGRESS.md·이 노트)만.
- 점검 근거: `<table>` 전부 `overflow-x-auto` 동반(미래퍼 0)·반응형 prefix 없는 밀집 고정 그리드(≥5열) 0·위험 `whitespace-nowrap` 0(잔존 3건 desktop-only/짧은 링크/배지로 안전)·CTA/배지/칩 행 `flex-wrap`+`gap`+`break-words`+`min-w-0`·가로 스크롤 영역 `overflow-x-auto md:overflow-visible`+`min-w-[…]` 가드 확인(StockHeader·PriorityScoreCard·SectorComparison·DisclosureExplorer·today 변화 칩·status·pricing·CompareClient ScrollX·home).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p, exit 0) · 로컬 prod(3258) 12경로 200·SSR 에러 마커(Application error/Unhandled/Hydration/cannot read/TypeError/ReferenceError) 0·공통 마커 정상.
- Gate note: Playwright 미구성 → 실제 브라우저 자동 DESKTOP/390px 게이트 로컬 미가용(curl+SSR grep+소스 인스펙션+build 대체, 픽셀 단위 렌더 미보장). **운영자: 3000 재빌드·재기동 후 데스크톱/390px 브라우저로 12경로 육안 확인 권장** — `/today` 최근 변화 칩 줄바꿈·`/stock` 업종 비교 막대·`/stocks` 표형↔카드형 토글·`/disclosures` 공시 카드 액션행·`/compare` 시작 화면(클라 렌더)·요금제 2카드, 오버플로우 0·콘솔 0.
- Residual / next(큰 항목 후속): 실 브라우저 모바일 게이트 부재(소스 인스펙션은 클래스 가드만 확인, 폰트 메트릭·줄바꿈은 운영자 육안 필요). `/stocks` 11컬럼 표는 데스크톱 전용이라 태블릿 폭(768~1024px) 가로 스크롤 의존(중간 폭 카드 전환 후속 검토). `SectorComparison` 행은 ≤360px에서 의도된 가로 스크롤(초협폭 2줄 레이아웃은 데이터/구조 변경 필요로 범위 밖). 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

### Task 37 — OrnScore 1차 상용화 안정화 P2 — 데이터 소스 상용 리스크표·약관/개인정보/AI 고지 보강·관리자 QA 정리 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-37-ornscore-1-p2-ai-qa`**. 시작 HEAD `67defec`(= Task 33~36이 기준 `533c6d2` 위) — **리셋 없이 이어서** 작업(작업트리 클린). 로컬 검증 prod `127.0.0.1:**3253**`(운영자 4310 무중단·3000 미기동 상태 그대로, 내 리스너 PID 7420만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 설계서 메모: 외부 PDF PART L/M/N/O/P 원문 레포에 없음 → 지어내지 않고 **작업지시 + `docs/ornscore-improvement-brief.md`** 기준으로만 작성, 법적 결론 미확정("검토 필요" 표기).
- What changed (신규 문서 2 + 코드 4파일, 문서·표시·고지 문구만 / 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경):
  - **(2) 신규 `docs/data-source-commercial-risk.md`**: KRX·DART·Naver·yfinance·FinanceDataReader 6열 리스크 표(소스/사용 위치 코드 경로/상용 리스크/공식 인터페이스/대체·fallback/조치 상태). 전 항목 "검토 필요"·법적 결론 미확정. Naver(공식 API 부재 추정·대체 우선)·yfinance(비공식·fallback) 강조.
  - **(3) 신규 `docs/legal-ai-commercial-readiness.md`**: (A) 약관 9항목(결제일·자동갱신·해지·환불·청약철회·결제 실패·요금제 변경·장애 보상·유료 기능 변경) 현재 상태/보강 방향/확정 필요 표(결제 미라이브). (B) 개인정보 국외 이전 역할별 표(인증·저장=Supabase 일본/호스팅=Vercel 미국/메일=Resend 미국/AI=Anthropic 미국/소셜=Kakao 국내). (C) AI 고지 실행 전+결과 하단 문구안. 각 절 "초안 · 상용화 전 검토 필요" 리드.
  - **(4) 화면 반영(초안)**: `AiAnalysisCard.tsx` 실행 전 고지 1줄(버튼 위, Anthropic 미국 전달·비추천). `privacy/page.tsx` §5·§5-1 역할 라벨(인증·저장/호스팅/메일/AI/소셜 제공자)+§5-1 역할별 이전 표. `terms/page.tsx` "유료 서비스 이용 (출시 예정 · 초안)" 섹션(`/pricing` 링크·결제/환불/청약철회 출시 전 확정 고지, amber 초안 박스, 구속력 있는 수치 없음).
  - **(5) `status/page.tsx`**: 기존 도메인 품질(가격/재무/공시/산식)은 노출 중 → "데이터 오류 신고" 섹션 추가(종목·항목·기대값·URL·기준일/산식 prefill mailto, 44px 버튼). 전체 관리자 대시보드는 후속 과제로 명시(문서 링크).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p, exit 0) · 변경 4파일+문서 2 금지표현 grep 0(terms 기존 §2 "수익 보장"은 부정문 고지, 이번 변경 아님) · 로컬 prod(3253) `/ /status /pricing /guide/metrics /disclosures /backtest /terms /privacy` 200·에러 마커 0, SSR "데이터 오류 신고하기"·"유료 서비스 이용 (출시 예정 · 초안)"·"AI 처리 제공자" 렌더 확인.
- Gate note: Playwright 미구성 → 자동 게이트 미가용(curl+SSR grep+build 대체). 시작 시 포트 3000 미기동(운영자 미실행) — 변경 안 함. **운영자: 3000 재빌드·재기동 후 데스크톱/390px 체크 권장** — `/status` 오류 신고 버튼 44px·`/terms` 초안 박스·`/privacy` 역할 표, 오버플로우 0·콘솔 0.
- Residual / next: PART L/M/N/O/P 원문 미확보. 결제 약관 미확정(결제 미라이브, 출시 전 법무 확정). 데이터 소스 약관 원문 대조·Naver 대체·KRX 상용 라이선스 미해결. 전체 관리자 상태판/오류 신고 관리 시스템 후속 과제. 다음: 운영자 모바일 게이트, 결제 도입 시 약관 확정, 외부 릴리스(범위 외).

### Task 36 — OrnScore 1차 상용화 안정화 P1-B — 비교 시작 화면·상단/모바일 메뉴 단순화·종목 탐색 검색 우선·요금제 경계 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-36-ornscore-1-p1-b`**. 시작 HEAD `b3070dd`(= Task 33~35가 기준 `533c6d2` 위) — **리셋 없이 이어서** 작업(작업트리 클린). 로컬 검증 prod `127.0.0.1:**3251**`(운영자 3000/4310 무중단, 내 리스너 PID 15804만 taskkill). main 머지·외부 릴리스 범위 외(운영자).
- 설계서 메모: 외부 PDF PART F/G/H/K 원문 레포에 없음 → 지어내지 않고 **작업지시 2~5 + `docs/ornscore-improvement-brief.md`** 기준으로만 구현.
- What changed (코드 8파일, 표시·문구·서버 파생 데이터만, 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 무변경):
  - **(2) 비교 시작 화면** `compare/page.tsx`+`CompareClient.tsx`: 서버 `sectorOf` 그룹핑 **추천 비교 세트**(검증 보류 제외·`compositeOf>0`·업종 ≥2종목·상위 2~4·상위 3세트, `recommendedSets` prop). 클라 게이트 `===0`→**`<2`**(1개 선택 시 제거 칩+"1개 더 선택" 안내). 추가 경로 5종(추천 세트 순차 add로 4상한·오늘 Top5 ✓비활성·관심 종목에서 추가[`getWatchlist`]·검색·같은 업종). 최근 본 종목은 저장소 부재로 후속 과제(가짜 금지).
  - **(3) 메뉴 단순화** `Sidebar`+`MobileNav`+`MobileBottomNav`: 데스크톱 1차=오늘·종목 찾기·공시 신호·백테스트·요금제, 나머지 "더보기". 모바일 하단 4셀(오늘·종목 찾기·공시 신호+더보기), 관심을 MORE 시트로. 라우트/href·active·`aria-label`·Esc/닫기 보존.
  - **(4) 탐색 검색 우선** `StocksExplorer`: 검색창(헤더 아래·돋보기·큰 입력) 먼저 → 질문형 프리셋 → 빠른 프리셋 `<details>` 접힘 → 상세 필터. 정렬/필터 행 중복 검색 input 제거. 칩 바·초기화 보존, `matchesConfig`/정렬/저장검색/localStorage 무변경.
  - **(5) 요금제 경계** `pricing/page.tsx`: 무료 "탐색·기본 지표·오늘 후보 무료로 충분", Pro "왜 Pro인가 — 시간 절약·변화 알림·기록 관리"(수익률/조언 비제공). 한도 `limits.ts` 단일 출처. **Premium 미정의로 2티어 유지**. `AddToCompareButton` 4초과 토스트 친절 문구화.
- What passed: `tsc` exit 0 · `verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p·`/stocks` 14.1 kB, exit 0) · 금지표현 grep 0 · 로컬 prod(3251) `/ /today /stocks /compare /pricing` 200, SSR 마커(1차 메뉴+더보기·검색 우선·요금제 경계·`/compare` flight `recommendedSets` 반도체·IT부품 4종목) 확인.
- Gate note: Playwright 미구성 → 자동 게이트 미가용. `/compare` 시작 화면 본문은 클라(`mounted`) 렌더라 SSR HTML 미노출(데이터만 flight 확인). **운영자: 3000 재빌드·재기동 후 데스크톱/390px 체크 권장** — 비교 시작 화면·메뉴 5+더보기·모바일 4셀·검색 우선·요금제 경계, 오버플로우 0·터치 44px·콘솔 0.
- Residual / next: 최근 본 종목 저장소 부재(후속). Premium 미정의(2티어 유지). PART F/G/H/K 원문 미확보. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

### Task 35 — OrnScore 1차 상용화 안정화 P1-A — 공시 확인포인트 문구·카드 주의 라인·기간 고지·백테스트 오해 방지 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-35-ornscore-1-p1-a`**. 시작 HEAD는 기준 `533c6d2`가 아니라 `8966e63`(= Task 33 P0-A·Task 34 P0-B가 위에 쌓인 상태) — **리셋 없이 이어서** 작업(작업트리 클린). 로컬 검증 prod `127.0.0.1:**3252**`(운영자 4310 무중단, 내 리스너 PID만 taskkill). main 머지·외부 릴리스는 범위 외(운영자).
- 설계서 메모: 외부 PDF PART D/E 원문 레포에 없음 → 지어내지 않고 **작업지시 2~6 + `docs/ornscore-improvement-brief.md`** 기준으로만 구현.
- What changed (코드 10파일 + 샘플 3파일, 표시·문구·고지·데이터샘플 교정만, 점수 계산식·`backtest-result.json`·`direction` 데이터값 무변경):
  - **(2) 확인포인트 문구** `DisclosureExplorer.tsx`(SIGNAL_DESCRIPTIONS)·`disclosure-signals.ts`(treasury note "호재 신호"→중립): 자사주/보유변동/대형계약/유증·CB/정정 전부 "…확인 필요" 확인포인트로. detector treasury note 호재 단정 제거(/disclosures·/stock 양쪽 노출).
  - **(3) 방향 valence 제거** `DisclosureExplorer.tsx`+`StockDisclosures.tsx`: "방향 긍정 가능(red)/부정 가능(blue)" → "장내매수 단서/장내매도·처분 단서/방향 확인 필요" 중립 slate. data값 무변경.
  - **(4) 카드 구조 통일 + 주의** `DisclosureExplorer.tsx`: 타입배지→종목명→제출일→한줄요약→확인할 것(zinc)→**주의(amber 신규, cautionNote 첫 문장/폴백)**→액션행. 44px·flex-wrap 보존.
  - **(5) 수집 범위 상시 고지** `DisclosureExplorer.tsx`+`disclosures/page.tsx`: 조건부였던 "최신 200건" 안내를 무조건 노출("선택한 N일 전체 공시가 아니라 … 최신 100건씩(합 200건) … 표시 최대 50건"), 페이지 `<details>` 미러링. 미사용 dataStatus import 제거.
  - **(6) 홈↔공시 숫자 일치** `recentSignals.ts`+`api/disclosures/recent/route.ts`: signalCount=표시수(slice 50)로 클램프. **샘플 폴백 교정** `public/disclosure-samples/recent-signals.json`(signalCount 12→9·호재 note 2)·`005930.json`·`373220.json`(호재 note 1). `MarketSnapshotCards` 보조문구 "DART · 최신 200건 내".
  - **(백테스트)** `BacktestClient.tsx`+`backtest/page.tsx`+`BacktestRiskNotice.tsx`: h1 "실험 전략 백테스트", RiskNotice 단일 리드 "…현재 ORNSCORE 종합점수 검증 결과는 아닙니다."(dataStatus.limits.backtest 재사용), 마지막 리밸런싱 "현재 확인 후보나 추천 아님" 캡션, 세 날짜 분리(데이터 기간/생성일/사이트 현재 기준=siteDataAsOf prop).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p·`/disclosures` 11.3 kB, exit 0) · added 라인 금지표현 grep 0(잔존 "호재"는 부정 캐비엇 "호재/악재 점수가 아님"만) · 로컬 prod(3252) 5라우트 200·에러 0. SSR: 공시 카드 7요소 전수·"최신 200건 내/전체 공시가 아니라/표시 최대 50건" 상시·valence 배지 0·백테스트 실험/검증아님/3날짜·홈 9건=disclosures 9건.
- Gate note: Playwright 미구성 → 자동 DESKTOP/MOBILE 게이트 로컬 미가용. **운영자: 3000 재빌드·재기동 후 데스크톱/390px 체크 권장** — 공시 카드 주의 라인·액션행 44px·오버플로우 0, 백테스트 3날짜 푸터·기간 고지 줄바꿈, 콘솔 0.
- Residual / next: direction 데이터값 무변경(표시만 중립) — enrichment가 방향 확정 시 사실 라벨 승격 가능. `signalGuide.pastPattern`의 방향성 % 범위는 '이 공시 이해하기' 펼침 내부에만 노출(추가 완화 후속). 공시 표시 50/수집 200 상한은 성능 제약(상시 고지). PART D/E 원문 미확보. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

### Task 34 — OrnScore 1차 상용화 안정화 P0-B/P1 — 종목 상세 번호 중복·CTA 버튼 그룹·데이터 배지·점수/순위 분리·밸류 기준 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-34-ornscore-1-p0-b-ui`**. 시작 HEAD는 기준 `533c6d2`가 아니라 `b3b4f6f`(= Task 33 P0-A 2커밋이 533c6d2 위) — P0-B는 P0-A 위에 쌓으므로 **리셋 없이 이어서** 작업(작업트리 클린). 로컬 검증 prod `127.0.0.1:**3251**`(운영자 3000/4310 무중단, 내 리스너 PID 2140만 종료). main 머지·외부 릴리스는 범위 외(운영자).
- 설계서 메모: 기준 PDF/`ornscore_design_improvement_spec.md` 레포에 없음(외부). PART C/I/J 원문 미확보 → 지어내지 않고 **작업지시 2~7 + `docs/ornscore-improvement-brief.md`** 기준으로만 구현.
- What changed (6 files, 표시·문구·컨테이너만, 점수 계산식·데이터·버튼 로직 무변경):
  - **(2) 번호 중복** `BeginnerReading.tsx`: 하단 중복 앵커 칩(공시/재무/점수 근거) 제거 — 위 번호형 "먼저 확인할 것" ol·상단 "다음으로 확인할 것" 버튼과 3중 반복이었음. 번호 STEP 목록 1개만 캐논 유지, 칩 자리에 안내 1줄. 상세 `<ol>` 1개.
  - **(3) CTA 버튼 그룹** `stock/StockHeader.tsx`: actionsSlot(관심/비교/공유) 컨테이너 → 데스크톱 가로+`gap-2`, 모바일 `w-full`+`[&>*]:flex-1` 균등 폭 줄바꿈(텍스트처럼 안 붙게). 버튼 로직/라벨 무변경, 44px 유지.
  - **(4) 데이터 배지 분리** `stock/PriorityScoreCard.tsx`: 붙은 평문 3 span → 독립 pill `[필수 데이터 %]` `[이상값 점검 통과/중]` `[Metrics 2.4]`(`rounded-full`+테두리+`gap-1.5 flex-wrap`, 정적 리터럴).
  - **(5) 점수≠순위** `stock/MetricInsightCards.tsx`+`PriorityScoreCard.tsx`: 값 "점수 v / 100" 명시, 순위 별도 줄 "전체 상대순위 rank / total위 · 상위 X%", 해석 줄 "해석:" 라벨. 계산 무변경·표시 전용.
  - **(6) 밸류 기준** `stock/MetricInsightCards.tsx`+`app/stock/[ticker]/page.tsx`: 밸류 카드 "전체 풀 기준" 라벨, cyan 박스 "(위 밸류 점수와 기준 다름)". 업종 표본 부족(peers<4=-1) 시 박스 숨김 → **가짜 숫자 없이 안내 박스**(미제공·전체 풀 기준·업종 보정 후속 과제). peers<10 경고 보존.
  - **(7) 가이드 보강** `app/guide/metrics/page.tsx`: "읽기 전 검토 포인트" 박스 — 점수 vs 상대순위 차이 + 밸류 전체풀 분위 업종 편향(금융·지주 쏠림)·업종 대비 밸류 별도·종합점수 미포함. 비자문.
- What passed: `npx tsc --noEmit` exit 0(전후) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(SSG 138p·`/stock/[ticker]` 14 kB, exit 0) · 변경 6파일 금지표현 grep 0(부정문 "매수·매도 추천이 아닌"만) · 로컬 prod(3251) `/stock/005380 /stock/005930 /stocks /guide/metrics /status` 200·에러 0. SSR: 상세 `<ol>` 1개·구 칩 "관련 공시 확인" 0·배지 pill·"전체 상대순위"·"해석:"·"전체 풀 기준"·가이드 "읽기 전 검토 포인트" 전수 렌더.
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. **운영자: 3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — CTA 버튼 그룹(데스크톱 가로·390px 균등 줄바꿈)·배지 3개 안 붙음·점수↔순위 가독성·가로 오버플로우·콘솔 오류.
- Residual / next: (6) 업종 대비 밸류는 동일업종 PER·PBR 피어 4+ 일 때만 산출 — KRX 공식 업종코드 연동 시 표본 확대(후속). 설계서 PART C/I/J 원문 미확보(외부 PDF) — 추출본 레포 반영 시 잔여 재대조. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

### Task 33 — OrnScore 1차 상용화 안정화 P0-A — 금지표현 교체·공통 고지 3줄·Metrics 2.4 단일출처 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-33-ornscore-1-p0-a-metrics`**(시작 `533c6d2`, 클린·예상 일치). 로컬 검증은 prod `127.0.0.1:**3257**`(운영자 3000/4310 무중단, 내 리스너 PID 21788만 종료). main 머지·외부 릴리스는 범위 외(운영자).
- 목표: 1차 상용화 안정화(신뢰도·문구 리스크·UI 기본기·검증). 점수 계산식·데이터 생성 무변경, 신규 npm 0·빌드 단계 추가 0.
- What changed:
  - **금지 표현 교체**(부정문 고지는 보존): `page.tsx`/`today/page.tsx` riskNote의 "진입 전/진입 시점"→"급등 사유 확인"·"비중·시점 분할", today 과열 caption·"신규 진입"→"신규 편입", `ScoreTooltip.tsx` "저평가 진입"→"저평가 국면", `metricReadings.ts` "따라 사기"·"진입 시점" 문구 교체. `terms/page.tsx`("수익 보장"은 "제공하지 않습니다" 법적 고지)·`metrics.ts`(코드 주석) 보존.
  - **공통 고지 3줄** 홈 `RiskNotice`에 정확 노출(투자 추천 아님 / 점수·신호는 참고 정보·매수·매도 추천 아님 / 최종 판단·책임은 사용자). 문구는 `dataStatus.notices.disclaimer` 배열 **단일 소스**에서 읽음. 과잉 반복 회피(푸터 1줄 고지가 전역 커버).
  - **Metrics 버전 단일 표기**: `universe/page.tsx` 산식 버전 셀 → `dataStatus.metricsVersionLabel`("Metrics 2.4"). 전 화면 포맷 통일.
  - **게이트 강화**: `verify_metrics.py` FORBIDDEN에 다어절 금지 토큰 12종 추가(급등 예상·강력 매수·목표가·손절가·단기 급등주·무료 급등주·매수 후보·AI 픽·AI 추천·오늘 살 종목·따라 사기·진입 시점). 단독 "진입"/"매수 추천"은 오탐 회피로 제외.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(172라우트, exit 0) · 로컬 prod(3257) 검증 9라우트+`/compare`·`/universe` 200·서버 로그 에러 0. SSR: `/` 고지 3줄 정확, Metrics 2.4 6라우트 전수(2.3·"Metrics v" 0), 기준일 2026.06.24 일치, 11라우트 HTML 금지 토큰 grep 0("매수 추천"은 전부 부정문).
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. **운영자: 3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장**(가로 오버플로우·콘솔 오류·홈 고지 3줄).
- Residual / next: 가격 기준일 delayed 상태는 의도된 정직 표시(유지). 게이트는 단독 "진입"/"매수 추천" 미검사(오탐 회피) — 신규 문자열 수기 주의. 다음: P0-B(설계서 잔여), 운영자 모바일 게이트, 외부 릴리스(범위 외).

### Task 27 — OrnScore 비주얼 리뉴얼 Phase 7 — /backtest KPI 수익/위험 분리·위험 안내 강화·월별 히트맵·MDD 차트·기여 Top/Bottom (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-27-ornscore-phase-7-kpi`**(시작 `1ae9486`, 클린, `4f5b277` 라인 유지·되돌림 없음). 로컬 검증은 prod `127.0.0.1:**3255**`(운영자 3000/4310 무중단, 내 리스너 PID 15684만 종료). main 머지·배포는 운영자 범위.
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 7(§11.2~§11.5·§15·§20.7)**. `/backtest`를 평면 6카드 → **수익/위험 분리 KPI + 강화된 위험 안내 + 월별 히트맵 + 낙폭(언더워터) 차트 + 기여 Top/Bottom 막대**. 점수 계산식·데이터 생성·`backtest-result.json` **무변경**, 비자문 톤(수익률만 강조 금지·`수익 보장`/`추천 전략`/`매수 신호` 금지), **신규 npm 0**(순수 CSS/SVG/HTML).
- 신규 4파일 `src/components/backtest/`:
  - `BacktestRiskNotice.tsx`(서버): 위험·한계 안내 단일 소스. 과거 데이터 기반 시뮬레이션·**미래 수익 비보장**·**수수료·슬리피지·체결 지연·유동성 한계**·생존편향·미래참조 제거·지표범위 한계를 항목으로 명시 + (옵션) 벤치마크/가정 줄. `/backtest` 실데이터·준비중 양쪽 재사용(기존 상·하단 amber 문단 2개 흡수해 중복 제거).
  - `MonthlyHeatmap.tsx`: 연도(행)×월(01~12 열) 순수 CSS 그리드 히트맵. `monthlyReturns`(미사용) 표면화. 셀 색은 정적 Tailwind 리터럴 9버킷(상승=red·하락=blue·0/미보유=zinc). `overflow-x-auto`+`min-w-[560px]`로 390px 가로 넘침 회피, `title`/`aria-label`에 연·월·% 노출.
  - `DrawdownChart.tsx`: `equityCurveMonthly.equity` 직전 고점 대비 낙폭(언더워터) 순수 SVG 면적 차트. 최저점(최대낙폭) 월 표시·`maxDrawdown` 주석. EquityChart와 동일 viewBox+`w-full h-auto`, `role="img"`+`aria-label`. 하락=파랑.
  - `ContributionBars.tsx`(서버): `contributors`를 pnl 부호로 **수익 기여 상위/손실 기여 상위** 2그룹 가로 막대. 그룹 내 max |pct| 기준 길이, 수익=red·손실=blue, 각 행 `/stock/{ticker}` `prefetch={false}` 링크(`names`). 데이터 없으면 렌더 안 함(날조 금지).
- 변경 2파일:
  - `BacktestClient.tsx`: 평면 6카드 metricCards 제거 → **수익 그룹**(CAGR·총수익률 vs 벤치·누적 초과수익) / **위험 그룹**(MDD vs 벤치·Sharpe vs 벤치·승률) 2박스(`KpiCell`). 위험 그룹은 rose 테두리/배경+`ShieldAlert`+"위험" 라벨로 색만으로 전달 않게(§20.7). 인라인 amber 문단 → `BacktestRiskNotice`. EquityChart 아래 `DrawdownChart`→`MonthlyHeatmap`→연도별 막대→`ContributionBars`+보유 칩. 전략 탭·composite 기본 보존.
  - `src/app/backtest/page.tsx`: 준비중 fallback에 `BacktestRiskNotice` 추가(badges 아래).
- 결정: (1) MDD를 등락 색(상승=red) 혼동 없이 보이려고 **위험 그룹은 rose 톤+아이콘+라벨** 분리(값도 rose). 수익 그룹은 기존 등락 색 유지. (2) 상·하단 amber 중복 문단을 단일 `BacktestRiskNotice`로 통합. (3) 히트맵 색은 전부 정적 리터럴(런타임 합성 0).
- 통과: `npx tsc --noEmit` exit 0(전후) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(타입게이트·`/backtest` 7.24 kB, exit 0) · 로컬 prod(3255) `/backtest`·`/today`·`/stocks`·`/stock/005380` 200, 에러 마커 0. `/backtest` SSR에 수익/위험 그룹·위험 안내(수수료·슬리피지·체결 지연·유동성·미래 수익 비보장)·월별 히트맵·낙폭(언더워터)·수익/손실 기여 상위·인라인 벤치(총수익률 +290.5%/MDD −28.0%/Sharpe 0.98) 렌더. 신규/변경 파일 금칙어 grep = 0.
- 게이트 한계: Playwright 미구성 → 자동 게이트 로컬 미가용. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 KPI 수익·위험 2박스(1열↔2열)·히트맵 `overflow-x-auto` 가로 넘침 0·낙폭 차트 반응형·기여 막대 1열↔2열·콘솔 오류 0.
- Residual / next: 백테스트 생존편향 실해결(시점별 유니버스 재구성) 열림(현재 안내 문구). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외). 성과 기여는 전략별 9종목 누적만 — 시점별 기여 시계열은 데이터 없어 후속 과제.

### Task 26 — OrnScore 비주얼 리뉴얼 Phase 6 — /disclosures 공시 신호 카드 피드·타입 색/아이콘·이해하기 UX (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-26-ornscore-phase-6-ux`**(시작 `8b2ac57`, 클린, `4f5b277` 라인 유지·되돌림 없음). 로컬 검증은 prod `127.0.0.1:**3253**`(운영자 3000/4310 무중단, 내 리스너 PID 2412만 종료). main 머지·배포는 운영자 범위.
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 6(§10.2~§10.6·§15·§20.7)**. `/disclosures`를 테이블식 → **상단 카드형 요약 대시보드 + 이벤트 피드 카드**. 공시 분류 로직·API fallback·점수/데이터 생성 무변경, 비자문 톤(호재/악재 단정 금지), 신규 npm 0.
- 신규 2파일:
  - `src/lib/disclosureType.ts`: `signalType` → `{label, shortLabel, Icon(lucide), badgeBg/Text/Border, dot, cardBorder}` 단일 소스 + `DISCLOSURE_TYPE_ORDER` + `typeMetaOf()`. **색 매핑(§10.4)**: 자사주=green · 보유변동=purple · 대형계약=teal(청록) · 손익정정=amber(주황) · 유증/CB=red. 전부 정적 Tailwind 리터럴(런타임 합성 0). 색은 항상 텍스트 라벨/아이콘/도트 동반(§20.7). 미분류=중립 회색 폴백.
  - `src/components/disclosures/DisclosureSummaryCards.tsx`(presentational): 타입별 요약 카드 항상 5개(`grid-cols-2`→sm:3→lg:5), 아이콘+라벨+묶음 수+캡션, 0건 muted.
- 변경 2파일:
  - `DisclosureExplorer.tsx`: `SIGNAL_STYLES`/`CANON_TYPES` 제거 → 필터 칩·카드 배지/테두리를 `typeMetaOf(g.signalType)`로. 요약 카드 렌더(`signalCounts` 전달). 각 묶음을 이벤트 카드(좌측 타입색 테두리·아이콘 배지·종목/코드/제출일·한 줄 의미·구분된 "확인할 것" 라인·액션 행)로 재구성. 터치 44px·`flex-wrap`·`break-words`로 390px 넘침 회피. 로딩/에러/빈 상태/SSR initialData 보존.
  - `SignalGuideExpand.tsx`: `url` prop로 펼침 내부 DART 원문 링크 추가(§10.6), 헤더를 `disclosureType` 타입 아이콘/색으로 일관화, 트리거 44px.
- **색-토큰 결정**: capital_raise(빨강) vs 방향 배지 "긍정 가능"(빨강)은 별개 배지·다른 텍스트라 혼동 낮아 방향 매핑 보존. `StockDisclosures.tsx`(상세 `SIGNAL_BG`) 무변경 — retone은 `/disclosures` 한정(상세 회귀 0).
- **"이 공시 이해하기" 결정**: §10.6의 "긍정/부정적으로 볼 수 있는 경우" 섹션은 자문 톤("좋은 신호"/매수/호재) 없이 깔끔히 분리하기 어려워 **기존 인라인 펼침 유지**(이미 일반적 의미·확인 항목·과거 패턴·주의·원문 노출). 모달 대신 코드베이스 기존 인라인 펼침 채택.
- 통과: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·Metrics 2.4, exit 0) · `npm run build`(타입게이트·`/disclosures` 11.1 kB, exit 0) · 로컬 prod(3253) `/disclosures`·`/today`·`/stock/005380` 200, `/disclosures` SSR에 5 요약 카드 라벨·5색 토큰(green/purple/teal/amber/red)·이벤트 마커(자동분류·이 공시 이해하기·원문 보기·확인할 것)·캡션 렌더, 에러 마커 0, 신규/변경 파일 금칙어 grep = 비자문 부정문만.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장**(요약 카드 2열↔5열·타입 색 밴드·이벤트 카드 가로 넘침 0·이해하기 펼침·터치 44px·콘솔 오류 0).
- Residual / next: Phase 7(백테스트 차트·손실 기여 막대). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

### Task 25 — OrnScore 비주얼 리뉴얼 Phase 5 — /stock 상세 게이지·지표 카드·업종 비교 시각화 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-25-ornscore-phase-5`**(시작 `5381720`, 클린). 로컬 검증은 prod `127.0.0.1:**3251**`(운영자 3000/4310 무중단, 시작 PID 15780만 종료). 외부 공개 주소·main 머지는 범위 외(운영자).
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 5(§9.2~§9.7·§14·§15)**. Task #15 결론 카드(`StockConclusionHero`)·#23 톤 위에서 그 아래/주변 점수 해석·비교 시각화 강화 — 결론 카드는 갈아엎지 않음. 점수 계산식·데이터 생성·JSON-LD·breadcrumb·`generateMetadata`/`generateStaticParams`·`StockTabs` 탭 id/순서·가격 동기화·`surge3m`/`riskAlert`·관심/비교/공유 슬롯 **무변경**, 비자문 톤, 신규 npm 패키지 0.
- 신규 3파일:
  - `src/lib/metricReadings.ts`: `BeginnerReading`의 `readMomentum/readFlow/readValue/readVol`+`getChecklistByPattern`+`readingsOf`를 추출(문구 바이트 동일·순수 함수). 초보자 카드·지표 카드 공유 단일 소스. 점수 계산 무관(표시 문구 출처만 이동).
  - `src/components/stock/MetricInsightCards.tsx`(서버, 훅 0): 4지표 카드. 지표명+`ScoreTooltip`, 원점수·상위/하위 백분위, `scoreColorOf` 밴드 막대, 한 줄 해석, 확인/주의 태그(caution=주황 "주의", 그 외 파랑 "확인"). grid 1열→sm:2열. 밸류 카드만 `per`/`pbr`을 받아 PER·PBR 문구 렌더.
  - `src/components/stock/SectorComparison.tsx`(서버): 업종 비교. 행마다 순위 배지·종목명(`/stock/{ticker}` `prefetch={false}`)·가로 종합점수 막대(밴드색)·PER/등락 보조·현재 종목 ring+bg+"현재" 태그. `overflow-x-auto`(min-w-280)로 390px 넘침 회피. sectorCount<2면 안내 빈 상태. 점수는 page.tsx에서 1회 계산해 `sectorRows`로 전달(재계산 없음).
- 변경 4파일:
  - `src/components/stock/PriorityScoreCard.tsx`: `ScoreGauge`(88·showLabel·showOutOf)로 점수 주인공화 + 전체/업종 순위·데이터 %·이상값 점검·산식 버전 보존. **suspect는 게이지 대신 회색 숫자**(매수 게이지 오인 방지). props 시그니처 무변경 → 호출부 무수정.
  - `src/components/BeginnerReading.tsx`: 제목 **"초보자는 이렇게 보세요"**, 헤드라인 아래 순서형 **"먼저 확인할 것"(점수→공시→재무, §9.5)** ol(앵커 `#basis`/`#disclosures`/`#financials`) 추가, 기존 패턴 항목은 "이 종목에서 특히 볼 것"로 유지, 고지·앵커 칩 보존. 해석/체크리스트는 `metricReadings.ts` 위임.
  - `src/components/stock/NextActionButtons.tsx`: 4앵커(공시 확인/재무 보기/점수 근거/업종 비교) 라벨·아이콘 정돈, 44px·2열/4열 유지. 관심/비교는 헤더 실버튼 담당 → 죽은 링크 날조 안 함.
  - `src/app/stock/[ticker]/page.tsx`: `MetricStrip` import 제거→`MetricInsightCards`/`SectorComparison` 추가, 지표 섹션·업종 `<table>` 대체, `sectorRows` 계산 추가. "지표 가이드 →"·"전체 N종목 대비" 보존.
- 결정/잔여: (1) suspect는 밴드색 게이지가 매수 신호처럼 보일 수 있어 회색 숫자 유지(#15 톤 일관). (2) `readValue`가 PER·PBR 문구를 쓰므로 밸류 카드만 per/pbr 전달. (3) `MetricStrip.tsx`는 상세 미사용이나 파일 잔존(타 화면 영향 0, 삭제 범위 외).
- 검증: `npx tsc --noEmit` exit 0(전후) · `PYTHONUTF8=1 verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4 일치, exit 0) · `npm run build`(타입게이트·138p SSG, `/stock/[ticker]` 13.9 kB, exit 0) · 로컬 prod(127.0.0.1:3251) `/stock/005380`·`/stock/005930`·`/stocks`·`/today` 200 · `/stock/005380` SSR에 탐색 우선도 게이지(aria "종합 점수")·자체 지표 4종(확인×2/주의×2)·"초보자는 이렇게 보세요"+"먼저 확인할 것"·"같은 업종 비교"+막대 범례 렌더, 에러 마커 0 · 신규/변경 파일 금칙어 grep = 비자문 부정문·기존 보존 문구만.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px 게이지 가독성·지표 카드 1열↔2열·업종 비교 막대 `overflow-x-auto` 가로 넘침 0·다음 액션 44px·콘솔 오류 0.
- Residual / next: Phase 6(공시 카드 피드·타입별 색/아이콘·해석 모달)·Phase 7(백테스트 차트)·전역 라이트 토큰(#F6F8FB, 범위 외).

### Task 25 (Gate Repair) — Playwright stale 3000 CSS 400 복구 (2026-06-25, Claude)
- 증상: AI Center 게이트 DESKTOP·MOBILE 둘 다 `400 .../_next/static/css/d1665e0e41509995.css`(+ `/`·`/stocks` `_rsc` ERR_ABORTED).
- 원인: 코드 결함 아님. 포트 3000 `next start`(PID 23992, Task 24 복구 때 Codex 가 `d1665e0e…` 빌드로 띄운 것)가 살아있는 채 Task 25(`b697386`) 재빌드로 CSS 해시가 `d1665e0e…`→`302c90d13f468b6d` 로 바뀌어 stale 400. Task 15·24 와 동일 staleness 레이스.
- 조치(소스 무변경): `.next` 클린 재빌드(`302c90d…`) → tsc 0·build 0·verify_metrics 0 → 빈 포트 3251(내 PID 20368)로 신 빌드 검증: `/ /stocks /today /stock/005380 /stock/005930` 200, 신 CSS 200(stale 참조 0), Task 25 마커 전수 SSR, 에러 0. 내 PID 20368 만 종료(3000/4310 무중단).
- 복구 완료(Codex): stale 3000 PID 23992만 종료하고 포트 3000을 PID 13444로 재기동. 4310(PID 24672)은 무중단. `/stock/005380` Phase 5 마커 4종 렌더, 정적 asset 12개 전수 200(BadAssets 0), `/ /stocks /stock/005380 /stock/005930 /disclosures /backtest` HTTP 200 확인. 상세는 PROGRESS.md 2026-06-25 Task 25 Repair 항목.

### Task 24 — OrnScore 비주얼 리뉴얼 Phase 4 — /stocks 점수 히트맵 표/카드 보기모드 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-24-ornscore-phase-4`**(시작 `4f5b277`, 클린). 로컬 검증은 prod `127.0.0.1:**3251**`(운영자 3000/4310 무중단, 내 시작 PID만 종료). 외부 공개 주소 갱신·main 머지는 범위 외(운영자).
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 4(§8.5 데스크톱 점수 히트맵 테이블·§8.6 모바일 카드·§15.5 모바일 필터·§20.5 빈 상태)**. 이미 끝난 **Task #16 질문형 프리셋/필터 위에 2차 고도화** — 되돌리거나 중복 구현 안 함. 점수 계산식·데이터 생성·필터 파라미터·저장검색/알림/`?theme=` 딥링크 **무변경**, 비자문 톤, 신규 npm 패키지 0.
- 신규 1파일 `src/components/stocks/StockResultsTable.tsx`(presentational, 훅 0):
  - 데스크톱 점수 히트맵 테이블. **11컬럼**: 종목명·업종·현재가·등락률·종합점수·추세·거래활성도·밸류·위험조정·신호·액션. 점수 5컬럼은 `ScoreHeatCell`(내부)로 `scoreColorOf` 밴드(80↑ blue/60~79 sky/40~59 amber/<40 zinc) 배지 — `c.badge` 정적 리터럴만 사용해 Tailwind 스캔 누락 회피(런타임 합성 0). `<table>`을 `overflow-x-auto`로 감싸고, 종목명/액션은 `/stock/{ticker}` `prefetch={false}` 링크, 등락률 색 카드와 동일(상승 red·하락 blue), 숫자 tabular-nums.
  - `deriveSignals()` export — 점수 파생 강점/주의 칩(추세 강함/거래 활발/저평가 가능/위험 대비 양호 + 추세 약함/거래 부진/밸류 부담/변동성 큼/가격 하락 중/급등 주의). 카드와 표가 동일 로직 공유.
- 변경 `src/components/StocksExplorer.tsx`:
  - `viewMode`("card"|"table") state + `localStorage("stocks-view-mode")` 보존(useEffect 복원, 기본 카드형, try/catch graceful). 검색·정렬 행에 **데스크톱 전용(`hidden lg:inline-flex`)** 카드형/표형 세그먼트 컨트롤.
  - 결과 영역: `viewMode==="table"`이면 데스크톱(`hidden lg:block`)은 `StockResultsTable rows={sorted.slice(0,100)}`, 모바일(`lg:hidden`)은 카드형 강제. 카드/표 공통 "상위 100개" footnote.
  - 카드 인라인 신호 도출을 `deriveSignals`로 통일(중복 제거), 카드 map을 `renderCards()`로 추출(카드형/표형-모바일 공용). 카드 헤더에 `· {sector}` 보조표기.
  - 빈 상태(§20.5): `strongestConstraint()`가 활성 조건 중 가장 강한 1개(점수 min·PER/PBR 상한·ROE/배당·테마·시총·적자제외·시장)를 휴리스틱 strength로 골라 "○○ 조건이 강해 결과가 없습니다" 명시. 버튼 2개 — **가장 강한 조건 완화**(그 조건만 해제+activePreset 클리어) / **전체 종목 보기**(resetFilters). 비자문 톤.
- 변경 `src/app/stocks/page.tsx`: 뷰모델에 `sector: sectorOf(s.themes)` 추가(`@/lib/sector`, 홈 `StockCandidateCard`/`/today` 후보와 동일 소스). `Stock` 인터페이스에 `sector?: string`.
- 결정/잔여: (1) **공시/신호 컬럼은 "신호"로 라벨** — 클라 컴포넌트에서 종목별 공시 실데이터 동기 접근 불가라 "공시 있음" 플래그를 날조하지 않고 점수 파생 칩만 노출(설계 지침: 가짜 데이터 금지). 실 per-stock 공시 데이터셋 연결 시 "공시"로 교체. (2) 모바일은 테이블 미사용 — 표형 토글 자체가 `hidden lg:inline-flex`라 도달 불가, <lg는 항상 카드. (3) `strongestConstraint` strength는 표시·랭킹 휴리스틱(점수 계산 무관). (4) 저장검색/알림/`?theme=`/필터 파라미터 핸들러(`handleSaveSearch`/`handleCreateAlert`/`applySavedConfig`/`togglePreset`/`SavedSearchConfig`)는 전부 무변경.
- 검증: `npx tsc --noEmit` exit 0 · `PYTHONUTF8=1 verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4 일치, exit 0) · `npm run build`(타입게이트·`/stocks` 13.9 kB, exit 0) · 로컬 prod(127.0.0.1:3251, 내 PID만 종료) `/stocks`·`/stocks?theme=반도체`(인코딩)·`/today`·`/stock/005930` 200 · `/stocks` SSR에 카드형/표형 토글·정렬/컬럼 라벨 렌더·에러 마커 0 · 신규/변경 파일 금칙어(추천/매수후보/수익기대/급등예상/상승가능성/매도) grep 0.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱(≥1024px) 카드형↔표형 토글 동작·표 점수 히트맵 색 밴드(blue/sky/amber/zinc)·가로 오버플로우 0, 390px 모바일은 표형 토글 미노출·카드형 유지·가로 오버플로우 0·콘솔 오류 0, localStorage 보기모드 새로고침 유지.
- Residual / next: (1) 실 per-stock 공시 데이터셋 연결 시 표 "신호" 컬럼 → "공시" 교체. (2) Phase 5(`/stock` 상세 게이지·업종 비교 시각화)·Phase 6(공시 카드 피드·해석 모달)·Phase 7(백테스트 차트)가 남은 설계서 단계. (3) 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

### Task 23 — OrnScore 비주얼 리뉴얼 Phase 3 — /today 대시보드화 (2026-06-25, Claude)
- Preview/branch: 리뷰 기준 **branch `ai-center/task-23-ornscore-phase-3`**(시작 `387f6b4`, 클린). 로컬 검증은 prod `127.0.0.1:**3250**`(운영자 3000/4310 무중단, 내 PID만 종료). 외부 공개 주소 갱신·main 머지는 범위 외(운영자).
- 목표: 설계서 `ornscore_design_improvement_spec.md` **Phase 3(§7·§15.2·§16.4)**. `/today`를 정보 나열형에서 홈 리뉴얼과 같은 수준의 금융 대시보드 첫인상으로. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤, 신규 npm 패키지 0, `layout.tsx max-w-5xl` 셸 무변경. 이미 끝난 홈 Hero/점수 UI(#21/#22)·필터(#16)·상세 결론(#15)·신뢰 배지(#17/#18) **중복 구현 안 함** — 전부 재사용.
- 신규 4파일 (`src/components/today/`):
  - `TodayStatusBar.tsx`(서버): 페이지 최상단 데이터 상태 바. 전역 `dataStatus` 단일 소스만 읽어 **데이터 상태(DataStatusBadge tone=statusTone)·주가 기준일(AsOfDateBadge globalAsOfLabel+장마감)·공시 기준(최근 업데이트)·산식 버전(MetricsVersionBadge metricsVersionLabel)**을 한 줄로. 데스크톱 가로 한 줄, ≤390px 자연 줄바꿈(divider는 `hidden sm:inline`). 두 번째 진실 소스 도입 안 함.
  - `TodayTopSection.tsx`(서버): 오늘의 Top 3 큰 카드. 홈 `StockCandidateCard` 재사용(게이지+4지표 MetricBar+강점/주의+CTA). grid `1→sm:2→lg:3`. "탐색 우선순위" 톤 카피.
  - `SignalSection.tsx`(서버): 신호별 섹션 컨테이너(제목·캡션·반응형 카드 그리드·footnote). 데이터 없으면 **EmptyState**("아직 해당하는 종목이 없습니다…") — 억지로 채우지 않음.
  - `SignalStockCard.tsx`(서버): 컴팩트 종목 카드(ScoreGauge size 56 + 이름/코드/업종/가격/등락 + 한 줄 신호 + 카드 전체 링크). 과열 주의는 `caution` amber 톤.
- 변경 1파일: `src/app/today/page.tsx`
  - **추가**: 최상단 `TodayStatusBar`, 시장 KPI 4카드(**홈 `MarketSnapshotCards` 재사용** — 분석 종목/종합 80+/거래활성도 급증/공시 신호), `TodayTopSection`(Top3), 신호별 6섹션(종합 점수 상위=compositeRest slice(3,9) / 거래활성도 급증=flowStats.ratio≥1.5 ∥ flow≥75 / 밸류 매력=topValue / 추세 강함=topMomentum / 과열 주의=r3m≥80 caution / 최근 공시 있음=recentSig를 universe 종목에 매핑).
  - **대체(중복 제거)**: 기존 3개 KPI 카드(분석 종목/PER 중앙값/PBR 중앙값) → 시장 KPI 4카드. `StockTabs`(종합/저평가/추세 리스트) → 신호별 6섹션. 하단 amber "오늘 먼저 볼 공시 신호" 블록 → "최근 공시 있음" 신호 섹션으로 흡수.
  - **보존**: 오늘의 브리핑+AI 인사이트, 최근 장마감 변화, 체크리스트, 푸터 고지(하위 신뢰 레이어). `compositeReason`/`valueReason`/`momentumReason`/`strongMetrics`/`riskNote`는 신호 문구·Top3 VM에 재사용.
- 결정/잔여: (1) **이중 CTA(자세히 보기+비교 추가)는 단일 CTA로 축소** — `/compare`는 `?add=` 파라미터를 받지 않고 localStorage("비교에 추가")로만 동작 → 동작 안 하는 링크를 날조하지 않고 `자세히 보기`(/stock) 단일 CTA만(설계 지침의 "없으면 생략" 따름). (2) KPI '거래활성도 급증'은 실 거래량 급증 데이터 부재로 `homeSnapshot.volumeSpikeCount`(거래대금 5d/20d ratio≥1.5, 폴백 flow≥75) **파생 추정** — 캡션·footnote에 명시. (3) 모바일은 테이블식 축소 대신 **카드 스택**(grid-cols-1) — 가로 스크롤 행 대신 세로 스택으로 390px 오버플로우 구조적 회피. (4) Top3 = compositeOf 상위 3(!isSuspect), 종합 상위 섹션은 4위 이후로 중복 최소화.
- 검증: `npx tsc --noEmit` exit 0 · `PYTHONUTF8=1 verify_metrics.py`(138종목 0오류·금칙어 0·Metrics 2.4 일치, exit 0) · `npm run build`(타입게이트·172p, `/today` 854 B, exit 0) · 로컬 prod(127.0.0.1:3250) `/today / /stocks /stock/005380` 200 · `/today` SSR에 상태 바(데이터 상태/주가 기준/산식 버전)·KPI 4·Top3+신호 카드 게이지 34개(aria "종합 점수")·6섹션 제목 전수 렌더·에러 마커 0. 변경/신규 파일 금칙어 grep = 비자문 부정문("매수 추천이 아니라"·"매수 신호가 아니며")만(고지 허용).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — `/today` 360~390px 가로 오버플로우 0·상태 바 줄바꿈·KPI 2열·Top3 1열 스택·신호 카드 게이지 가독성·CTA 44px·콘솔 오류 0.
- Residual / next: (1) `/today`·`/stocks`·`/stock` 외 전역 라이트 토큰(#F6F8FB) 미도입(범위 외). (2) 실 거래량 급증 데이터 소스 생기면 `homeSnapshot.volumeSpikeCount`만 교체. (3) 신호 섹션 모바일 가로 스냅 스크롤(§7.5 대안)은 현재 세로 스택 — 필요 시 후속. (4) Phase 4(종목 탐색 히트맵 테이블)·Phase 5(상세 게이지 확장)·Phase 6(공시 카드 피드)·Phase 7(백테스트 차트)가 남은 설계서 단계.

### Task 22 — OrnScore 홈 비주얼 임팩트 강화 (1.5차) (2026-06-24, Claude)
- Preview/branch: 사용자 확인 화면 **http://127.0.0.1:3000**, 리뷰 기준 **branch `ai-center/task-22-ornscore-1.5`**(시작 `a70d4b3` = Task 21, 클린). 외부 공개 주소 갱신·릴리스는 **이번 범위 아님**. 로컬 `npm run build`로 `.next` 재생성 — 운영자가 3000을 `next start`로 띄워뒀다면 **재기동 권장**(stale 청크 회피).
- 목표: Task 21 기반(ScoreGauge/ScoreBadge/MetricChip/MetricBar/scoreColor) 위에서 홈 첫 화면의 시각 임팩트·대시보드감을 **확실히** 강화. 설계서 §2.1·§2.2·§6·§23. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤 유지, 신규 npm 패키지 0, `layout.tsx` `max-w-5xl` 셸 무변경.
- What changed (3 files):
  - `home/HomeHero.tsx`: 배경을 차분한 slate/blue 그라데이션 → **딥블루 패널**(`from-blue-800 via-blue-900 to-slate-900`, 다크 `from-blue-950 …`)로 전환해 대비를 키움. 좌측 카피는 화이트 텍스트(강조어 `text-sky-300`로 bg-clip 장식 제거). 우측 미리보기는 딥블루 위 **흰 카드 '화면'**(shadow-xl·ring·상단 구분선)로 분리해 "실제 서비스 화면 축소" 느낌. 1순위 **ScoreGauge 80→104px**(showLabel+showOutOf, 주변 여백↑)로 주인공화, 2~3순위 컴팩트 랭킹 행(업종 보조표기 추가), 하단 **KPI strip**을 아이콘+큰 숫자로 재구성(설계서 순서 공시 신호/거래활성도 급증/종합 80↑). primary CTA = 흰 solid(`bg-white text-blue-800`, 딥블루 위 최대 대비·dominant), secondary = 흰 outline(`border-white/30`), 둘 다 `min-h-[44px]`+`focus-visible` 링. 짧은 1줄 고지 유지.
  - `home/StockCandidateCard.tsx`: 위계 재정렬(종목명↑ 16px bold → 업종·코드 → 가격 → **ScoreGauge 72→84px showLabel** → 4지표 막대(연한 패널로 묶음) → 강점/주의 → CTA). 강점=초록 ✓ 마커+칩, 주의=주황 ! 마커+박스로 **스캔 용이하게 분리**. CTA `font-semibold`+`focus-visible`. 모바일 1열 스택·44px 유지, riskNote/강점 텍스트는 page.tsx 비자문 그대로.
  - `lib/scoreColor.ts`: `good`(60~79) 밴드가 라이트모드에서 가장 약해 `fill`/`barFill`의 sky-500 → **sky-600**으로 대비만 소폭 강화(4밴드 임계·라벨·다크변형 불변). 모든 색 클래스 정적 리터럴 유지(런타임 합성 0).
- 카피 안전: 신규 문자열 비자문만(탐색 후보·검증 보류 제외·강점·주의 등). 변경 3파일+ui/ 금칙어 grep 0(`투자 추천이 아닌` 고지 부정문 제외).
- What passed: `npx tsc --noEmit` exit 0(전후 2회) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 2.4 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 빌드 CSS(`81f0b0e5135674d6.css`)에 4밴드 `bg-*/text-*` 라이트+다크(`bg-sky-600`·`bg-sky-400`·`bg-blue-600/400`·`amber-500`·`zinc-400/500`)+딥블루 프레임(`from-blue-800`·`from-blue-950`·`via-slate-950`) 전수 존재 → **task-21 런타임 클래스 누락 회귀 없음**. 로컬 prod(127.0.0.1:**3200** 신규 — 3100은 직전 세션 stale `next start` 점유 중이라 회피, 운영자 3000 무중단) `/ /stocks /stock/005930 /guide/metrics` 200·에러 0. 홈 SSR: 104px·84px 게이지, `from-blue-800` 프레임, `bg-white text-blue-800` primary CTA, KPI 3종, aria 게이지 6, 강점/주의 5/5 렌더. `/stocks`·`/stock/005930` 에러 0(상세는 자체 PriorityScoreCard라 새 게이지 미사용 — 무회귀).
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+CSS grep+build로 대체. **운영자: 재빌드→3000 재기동 후 AI Center 브라우저 체크 권장** — 360~390px에서 Hero 세로 스택·104px 리드 게이지 가독성·후보 카드 비빽빽·KPI strip 줄바꿈·CTA 44px·밴드 색(blue/sky/amber/zinc).
- Residual / next: (1) 직전 세션 leftover `next start`가 3100 점유(PID 21332) — 운영자 정리 가능. (2) 새 점수 컴포넌트·딥블루 Hero는 여전히 **홈 한정** — `/today` KPI/Top3, `/stocks` 히트맵, `/stock` 상세 게이지 확장은 다음 작업(설계서 §7·§8.5·§9.3). (3) 전역 라이트 토큰(#F6F8FB) 미도입(범위 외). (4) 외부 공개 주소 미갱신(범위 외).

### Task 21 — OrnScore 비주얼 리뉴얼 1차 (홈 Hero + 점수 UI 기초) (2026-06-24, Claude)
- Preview/branch: 사용자 확인 화면 **http://127.0.0.1:3000**, 리뷰 기준 **branch `ai-center/task-21-ornscore-1-hero-ui`**(시작 `3e7b13e` 클린). 외부 공개 주소(valuemap.kr) 갱신·릴리스는 **이번 범위 아님**. 로컬 `npm run build`로 `.next` 재생성 — 운영자가 3000을 `next start`로 띄워뒀다면 **재기동 권장**(stale 청크 회피).
- 범위: 설계서 `ornscore_design_improvement_spec.md` Phase 1(디자인 시스템 기초) + Phase 2(홈 리뉴얼) 일부. 점수 계산식·데이터 생성·공시 분류 로직 **무변경**, 비자문 톤 유지.
- What changed:
  - 신규 디자인 시스템: ⭐`src/lib/scoreColor.ts`(점수→색/라벨 단일 소스, 4구간 §5.4, 색+한글라벨 동반, 다크 변형). ⭐`src/components/ui/` 4종 — `ScoreGauge`(순수 SVG 원형 게이지·`aria-label`)·`ScoreBadge`·`MetricChip`·`MetricBar`. 전부 서버 컴포넌트(클라 훅 0).
  - 홈: `home/HomeHero.tsx`(메인 카피 `오늘 볼 한국 주식, 점수로 먼저 좁혀보세요.`·CTA `오늘 후보 보기`/`지표 이해하기`·우측 **대시보드 미리보기 카드**=ScoreGauge+ScoreBadge+3스탯 요약·금융 톤 배경). `home/StockCandidateCard.tsx`(점수 게이지 주인공화·4지표 MetricBar·강점/주의 분리·업종 추가). ⭐`home/FeatureCards.tsx`(핵심 기능 3카드 오늘후보/공시신호/**백테스트 진입점 신규**). `app/page.tsx`(후보 VM에 sector+4지표 추가·Hero top3 전달·FeatureCards 연결, 기존 카운트/필터 무변경).
  - 고지: above-the-fold는 Hero 1줄 차분 고지만, 상세 `RiskNotice`는 하단 신뢰 레이어 유지(§17).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치) · `npm run build`(타입게이트·138p 프리렌더 exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 3000·4310 무중단) `/ /stocks /stock/005930 /guide/metrics /backtest /disclosures` 전부 200·에러 0. SSR grep으로 신규 Hero 카피·미리보기·게이지(aria 6)·강점 5블록·band 라벨 렌더 확인.
- Browser check: Playwright 미구성 → DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자 AI Center 브라우저 체크 권장**(재빌드→3000 재기동 후) — 360~390px ScoreGauge 가독성·후보 카드 세로 스택·터치 44px·band 색(blue/sky/amber/zinc).
- Residual / next: (1) 신규 점수 컴포넌트는 **홈에만** 적용 — `/stocks`·`/stock` 상세 재사용 확장은 다음 작업. (2) 밝은 금융 톤·기존 다크 모드 공존(전역 라이트 토큰 #F6F8FB 미적용, 범위 외). (3) MetricBar의 `text-*`→`bg-*` 치환은 scoreColor 토큰 네이밍 규약 의존. (4) 외부 공개 주소 미갱신(범위 외). 다음: 점수 컴포넌트 /stocks 히트맵·/stock 상세 게이지 확장(§8.5·§9.3) → Phase 3 오늘 페이지.

### Task 20 — OrnScore 세부 디자인·UX 다듬기 (모바일/배지/문구 일관화) (2026-06-24, Claude)
- Preview/branch: 사용자 확인 화면 **http://127.0.0.1:3000**, 리뷰 기준 **branch `ai-center/task-20-ornscore-qa`**. 외부 공개 주소(valuemap.kr) 갱신·릴리스는 **이번 범위 아님**(다음 작업으로 명시 보류). 로컬 `npm run build`로 `.next` 재생성 — 운영자가 3000을 `next start`로 띄워뒀다면 **재기동 권장**(stale 청크 400 회피).
- What changed (10 files, surgical Tailwind/문구만, 점수·데이터 로직·레이아웃 구조 무변경):
  - 데이터 드리프트 제거: `guide/metrics/page.tsx`·`backtest/page.tsx`의 하드코딩 `138(개) 종목`을 `dataMetadata.count`/`realStockPool.length`로 단일 소스화(산식 버전/기준일은 이미 `dataStatus` 파생).
  - 배지 톤 통일: `StocksExplorer` 헤더 상태 pill → 공유 `DataStatusBadge`(라벨 `갱신 지연`/`데이터 정상`, delayed=orange). `DisclosureExplorer`의 ad-hoc amber `최신 200건` 배지/안내문 → **limited=slate**(경고색 아님)로 `/disclosures` `제한 수집`과 맞춤. `HomeHero` 상태 색 amber/green → 앱 공통 orange/emerald.
  - 모바일 터치 타깃: 홈 후보·공시 카드 주요 버튼 `min-h-[44px]`, 기간/저장·알림 칩 `py-1`→`py-1.5`(조밀 칩 군집은 왜곡 회피 위해 중간값).
  - 다음 단계 CTA: `/backtest`·`/status` 막다른 화면에 `지표 계산 방식 보기 →`/`데이터 상태 확인 →`/`산식 변경 이력 →` 1줄 nav.
  - 중복 카피 정리: 종목 상세 `PriorityScoreCard`의 `매수·매도 추천이 아닌 탐색 우선순위입니다.` 1줄 제거(바로 아래 히어로 고지 박스가 동일 문구 표기). 필수 고지 보존.
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310·3000 무중단) 8개 점검 라우트 전부 200·에러 마커 0, SSR grep으로 변경 전수 렌더 확인.
- Browser check: Playwright 미구성 → DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자 AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 360~390px 터치/넘침, 상태 배지 색(주황/에메랄드), /disclosures 제한 배지 slate, /backtest·/status 하단 nav, 종목 상세 고지 1줄.
- Residual / next: (1) 외부 공개 주소(valuemap.kr) 갱신·릴리스 절차 **보류 → 다음 작업**(main 머지·Vercel 배포). (2) 클라 컴포넌트 제한 문구는 번들 회피로 props/리터럴 유지(서버 props 주입 시 완전 단일 소스화 가능). (3) `/backtest` 두 주의 문단 중복 일부 잔존(필수 고지 삭제 리스크 회피). (4) Playwright 도입 시 모바일 게이트 자동화.

### Task 18 — OrnScore 데이터 신뢰 레이어 Phase 2 (공시/백테스트/상태/산식 이력) (2026-06-24, Claude)
- What changed: Task 17의 전역 `dataStatus` 단일 소스를 설계서 `ornscore_data_trust_badge_spec_v1.md` 2차/3차 범위로 확장(§10.4·§10.5·§12·§13·§17.1). 투자 추천/매수 유도 카피 0.
  - `src/lib/dataStatus.ts`: `domainStatuses`(가격/재무/공시/산식) + `EXPECTED_METRICS_VERSION="2.4"` + `metricsChangelogPath`. 재무는 `realStockPool` PER/PBR 결측률>3% 시 `partial`(현재 0.7%→normal), 가격=전역 delayed 재사용, 공시=limited, 산식=메타 유무로 normal/error.
  - `/disclosures`: `제한 수집` 배지 + 필터 근처 `<details>` 보조설명(최신 200건·누락 가능성).
  - `/backtest`: 신규 `BacktestLimitBadges`(아이디어 검증용·현재 종합점수 검증 아님·생존편향 가능·슬리피지 단순화) 4종을 준비중·실데이터 두 분기 모두에 배치, 모바일 2×2 wrap.
  - `/status`: `데이터 종류별 상태` 섹션(가격/재무/공시/산식 4행, `DataStatusBadge`) + `/guide/metrics/changelog` 링크. 가격 `갱신 지연` 정직 유지.
  - 신규 `/guide/metrics/changelog`: 산식 변경 이력 스켈레톤(현재 Metrics 2.4·적용일·변경 요약). `/guide/metrics`에 상호 링크.
  - `scripts/verify_metrics.py`: §17.1 산식 버전 일치 단언 — stocks.json metricsVersion=="2.4" + src/ 하드코딩 `Metrics x.y` 드리프트 검출. **1차 실행에서 `metrics.ts` 주석 `Metrics v2.3` 2건 드리프트 검출 → 2.4로 교정**(가이드가 GitHub로 링크하는 참조 구현이라 공개 불일치였음, 스펙 이슈1 P0).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더·`/guide/metrics/changelog` 신규 라우트, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /disclosures /backtest /status /guide/metrics /guide/metrics/changelog /stock/005930` 200, 신규 카피 전수 SSR 렌더(제한 수집·4배지·도메인 4상태·changelog Metrics 2.4·상호 링크).
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. 운영자 AI Center 브라우저 체크 권장(제한 배지·details 펼침·백테스트 2×2 wrap·status 1열 스택·changelog 라우트).
- Next concrete OrnScore step (설계서 §23 3차): (a) 데이터 상태 자동 검증 강화(공시 200건 도달 limited 실판정·오류 로그 요약), (b) 산식 버전 단언을 CI(GitHub Actions)에도 연결, (c) 결측률/지연 공개 범위 + 관리자 경고, (d) 백테스트 생존편향 실해결.

### Task 25 (Pass 6) — 공시 핵심 숫자: 자기주식 취득 규모 (2026-06-23, Claude)
- What changed: 자사주 매입(`treasury_buy`) 공시 신호에 취득예정 주식수·금액(억원)을 사실 절로 덧붙이는 graceful enrich를 추가. Pass 5(임원 보유변동)와 동일 패턴.
  - 신설 `src/lib/treasuryDetails.ts`(`enrichTreasury`) + 신설 스캐폴드 `scripts/fetch_treasury_details.py`(DART `tsstkAqDecsn.json` → `public/data/treasury-signals.json`).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts`에서 `enrichTreasury(code, enrichInsider(code, sig))`로 합성. UI 편집 없음.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138 종목 프리렌더), 서버 청크에 신규 포맷 문자열 존재, 로컬 5라우트 200·에러 0.
- What remains / operator action:
  1) 실제 노출 활성화 → 송님이 DART 키로 `python scripts/fetch_treasury_details.py` 실행해 `public/data/treasury-signals.json` 생성(없으면 graceful no-op). 스크립트의 `tsstkAqDecsn` 필드명은 operator-verify 상태 — 실호출로 확인 후 필요 시 매핑만 교정.
  2) 다음 패스: 증자/CB를 `piicDecsn.json`/`cvbdIsDecsn.json` 구조화 엔드포인트로 동일 패턴 확장, 또는 single_contract/correction용 §18.2 본문 XML 파서 착수.

### Task 27 (Pass 7) — 공시 핵심 숫자: 증자·전환사채 발행 규모 (2026-06-23, Claude)
- What changed: 증자·CB(`capital_raise`) 공시 신호에 발행규모(억원)·자금용도 카테고리를 사실 절로 덧붙이는 graceful enrich 추가. Pass 5(임원 보유변동)·Pass 6(자기주식 취득)와 동일 패턴.
  - 신설 `src/lib/capitalDetails.ts`(`enrichCapital`) + 신설 스캐폴드 `scripts/fetch_capital_details.py`(DART `piicDecsn.json`+`cvbdIsDecsn.json` → `public/data/capital-signals.json`).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts`에서 `enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))`로 합성. UI 편집 없음.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138 종목 프리렌더), 공유 서버 청크(`chunks/3162.js`)에 신규 포맷 문자열(`발행규모`·`자금용도`)이 Pass 6 절과 함께 존재, 로컬 5라우트 200·에러 0, 두 disclosure API 200·error null(source=sample/cache graceful no-op).
- What remains / operator action:
  1) 실제 노출 활성화 → 송님이 DART 키로 `python scripts/fetch_capital_details.py` 실행해 `public/data/capital-signals.json` 생성(없으면 graceful no-op). 스크립트의 `bd_fta`(CB 권면총액)·`fdpp_fclt`/`fdpp_op`(유상증자 자금목적) 필드명은 operator-verify 상태 — `piicDecsn`/`cvbdIsDecsn` 실호출로 확인 후 필요 시 매핑만 교정.
  2) 다음 패스(유일하게 남은 비구조화 경로): single_contract/correction용 §18.2 본문 XML 파서 착수 — DART `document.xml` 다운로드 → 계약금액·직전매출 비율 추출 스캐폴드. (구조화 엔드포인트가 있는 공시 4종=임원·자기주식·유상증자·CB는 이제 모두 enrich 경로 확보.)

### Task 29 (Campaign 8) — BW 구조화 enrich + 단일계약 본문 XML 스캐폴드 (2026-06-23, Claude)
- What changed:
  - PRIMARY: 신주인수권부사채(BW)를 capital_raise 패밀리에 추가. `src/lib/disclosure-signals.ts`에 `RE_BW` + `detectCapitalRaise`의 `isBw` 분기(kind="신주인수권부사채"), `scripts/fetch_capital_details.py`에 `fetch_bw`(`bwbdIsDecsn.json`, 종목당 유증+CB+BW 3회), UI 보라 배지 2곳(`StockDisclosures.tsx`·`DisclosureExplorer.tsx`). `capitalDetails.ts`는 일반적이라 무변경.
  - SECONDARY: 단일계약(single_contract) 본문 파싱 착수. 신설 `scripts/fetch_contract_details.py`(§18.2 `document.xml` 다운로드→계약금액·직전매출비율 추출 오프라인 스캐폴드) + 신설 `src/lib/contractDetails.ts`(`enrichContract`, contract-signals.json 없으면 graceful no-op). `enrichContract`를 두 disclosure 라우트의 최외곽 래퍼로 합성.
- Copy safety: 신규 문자열은 발행규모·계약금액(억원)·직전매출 대비 비율(%) 등 사실 숫자만 — 투자 자문/호재·악재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138종목 프리렌더), 서버 청크 `.next/server/chunks/5337.js`에 `신주인수권부사채`·`계약금액`·`직전매출 대비` 존재, 로컬 5라우트 200·에러 0, 두 disclosure API 200·error null(source=sample/cache graceful no-op).
- Operator-only checks (DART 키 필요, 로컬 미실행):
  1) `python scripts/fetch_capital_details.py` 실행 → `public/data/capital-signals.json`(BW 포함) 생성. `bwbdIsDecsn` 응답의 `bd_fta`(권면총액)·`fdpp_*`(자금목적)·행사기간(`ex_pd_bgd/edd`) 필드명 실호출 검증 후 필요 시 매핑만 교정.
  2) `python scripts/fetch_contract_details.py`(DART 키) 실행 → `public/data/contract-signals.json` 생성. **본문 양식 편차가 커 `RE_AMOUNT`/`RE_RATIO`·zip 여부가 추정값** — 실보고서 1~2건 본문을 눈으로 보고 정규식 교정 필수.
- Next two concrete local tasks:
  (a) 본문 XML 스캐폴드 패턴을 correction(정정) enrich로 확장 — 정정 전후 수치 추출, contractDetails와 동일 graceful 패턴.
  (b) 공시 explorer 명료화 / 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 로컬 검증 가능.

### Task 31 (Pass 9) — 공시 핵심 숫자: 정정(correction) 본문 정정 전/후 (2026-06-23, Claude)
- What changed: 정정공시(`correction`) 신호에 본문 정정 전/후 핵심 수치를 사실 절로 덧붙이는 graceful enrich + 오프라인 본문 파싱 스캐폴드 추가. Pass 8(단일계약 contractDetails)과 동일한 §18.2 document.xml 파싱 패턴을 정정으로 확장.
  - 신설 `src/lib/correctionDetails.ts`(`enrichCorrection` — `correction-signals.json` 없으면 graceful no-op, ` · 정정 전 X억원 → 정정 후 Y억원`, 부호 보존·동일값 생략·null/NaN 방어) + 신설 스캐폴드 `scripts/fetch_correction_details.py`(운영 전용·로컬 미실행: list.json 정정 보고서 → document.xml → `RE_BEFORE`/`RE_AFTER`/`RE_FIELD` 추출 → `public/data/correction-signals.json`).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts`에서 `enrichCorrection`을 최외곽 래퍼로 합성. UI 편집 없음.
- What passed: `verify_metrics.py`(138종목·금칙어 0, exit 0), `npm run build`(타입게이트·138 종목 프리렌더, exit 0), 공유 서버 청크 `.next/server/chunks/7381.js`에 신규 포맷(`정정 전 …억원 → 정정 후`)이 형제 절(계약금액·발행규모·취득예정)과 함께 존재, 로컬 프로덕션(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) 5라우트 200·에러 0 + 두 disclosure API 200·error null(source=sample/cache graceful no-op, 로컬에 correction-signals.json 없음).
- Operator-only blocker (DART 키 필요): 송님이 `python scripts/fetch_correction_details.py` 실행 → `public/data/correction-signals.json` 생성 후, `⚠️ operator-verify` 정규식(`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`·zip 여부)을 실제 정정보고서 1~2건 본문과 대조해 매핑만 교정. 정정공시는 수치표 없이 사유만 서술하는 경우도 많아 실호출 검증 필수.
- Next two concrete local tasks: (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 [UI 전용, 빌드·렌더 검증]. (b) 6개 `enrichX` lib의 공통 lazy-load·원→억원 헬퍼를 단일 util로 통합해 중복 축소 [리팩터, 타입게이트 검증].


### Task 33 (Pass 10) — 공시 enrich 공통 util 추출(중복 축소) (2026-06-23, Claude)
- Pass 9의 '다음 패스 (b)' 해소. `src/lib/signalDetailsShared.ts` 신설(`loadSignalFile`/`matchRow`/`toEok`) → `insider/treasury/capital/contract/correctionDetails.ts` 5종이 각자 갖던 lazy-load·rcept_no 매칭·원→억원 헬퍼를 위임. enrichX 시그니처·note 문자열 전부 바이트 동일, 라우트 2종 무변경(순수 내부 리팩터).
- 통과: `python scripts/verify_metrics.py`(138종목 0오류·브랜드 0, exit 0) · `npm run build`(타입게이트 통과·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, `/api/disclosures/recent`·`/005930` 200·error null(graceful no-op 보존) · 빌드 청크에 6종 포맷 문자열 잔존.
- 남은 블로커(운영자 전용): 송님이 DART 키로 fetch 스크립트 실행 → `public/data/*-signals.json` 생성, 단일계약·정정의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 로컬 패스 후보: (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 — UI 전용. (b) `*Clause()` join 패턴 공통화 또는 `toEok`/`matchRow` 단위 assertion.


### Task 33 (Pass 11) — 공시 explorer 수집 기준 신선도 라벨 (2026-06-24, Claude)
- Pass 9·10이 남긴 '다음 패스 (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨' 해소. /disclosures 헤더에 `수집 기준 · {KST 시각} · {출처 한글}` muted 라벨 1줄 추가. 출처 한글은 StockDisclosures의 SourceBadge와 동일(실시간/저장본/예시 표본).
- 변경: `recent/route.ts`(live·sample 분기에 `fetchedAt` ISO 추가, cache는 원시각 carry), `recentSignals.ts`(SSR twin에 source/fetchedAt → 초기 렌더 라벨 노출), `DisclosureExplorer.tsx`(ApiResponse source?/fetchedAt? + sourceKo/fmtKST 헬퍼 + 헤더 라벨, graceful 가드). detectSignals·enrich 체인·점수·신호강도 무변경, UI 레이아웃/로직 변경 없음.
- 통과: `verify_metrics.py`(138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0, 라벨 문자열이 disclosures 클라이언트 청크에 컴파일) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) 5라우트 200·에러 0, `/disclosures` SSR에 라벨 렌더(KST 변환 정확), `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재.
- 남은 블로커(운영자 전용, 변동 없음): DART 키로 `fetch_*_details.py` 실행 → `public/data/*-signals.json` 생성, single_contract/correction의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 로컬 패스 후보: (a) 동일 신선도 라벨을 종목별 `StockDisclosures` 헤더에 적용(`[ticker]` 라우트 payload에 `fetchedAt` 추가 후 컴포넌트 헤더). (b) `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가 또는 6개 lib `*Clause()` ` · `-join 빌더 공통화.


### Repair — GlobalSearch hydration 경고 게이트 수정 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP 게이트가 React hydration 경고로 실패 — "Extra attributes from the server: style" at input(GlobalSearch). AppHeader(Server)→GlobalSearch(client)의 검색 input이 SSR HTML과 클라 vdom 사이 style 속성 불일치(검색 input은 브라우저/확장이 hydration 전 속성을 주입하는 대표 케이스).
- 변경: `src/components/GlobalSearch.tsx` 검색 input에 `suppressHydrationWarning` 추가(Next.js 권장). 순수 additive 1줄, 로직/스타일 무변경. MobileSearchButton의 동일 컴포넌트 인스턴스도 동시 커버.
- 통과: `npx tsc --noEmit` exit 0 · `npm run build`(타입게이트·138p 프리렌더, exit 0). ESLint는 미구성(대화형 셋업)이라 tsc/build를 확립된 finite check로 사용.
- 다음 로컬 패스 후보: (a) `[ticker]` 라우트 payload에 `fetchedAt` 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) GlobalSearch SSR/CSR 속성 일치 회귀 방지용 input 속성 스냅샷 메모 작성.


### Repair — Playwright 게이트 404(정적 청크) 수정: dev/prod distDir 분리 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP/MOBILE 게이트가 `_next/static` 404로 실패 — `css/app/layout.css`·`chunks/main-app.js`·`app/layout.js`·`app/not-found.js`·`app-pages-internals.js` 가 모두 404/ERR_ABORTED.
- Root cause: `npm run build`(타입게이트, prod)와 AI Center 게이트의 `next dev` 가 같은 `.next` 디렉터리를 번갈아 써서 손상. dev 서버는 unhashed dev 청크 경로(`app/layout.js`, `css/app/layout.css`)를 참조하는 HTML을 내보내지만, 디스크엔 prod-hashed 산출물(`layout-d2f87b43….js`, `css/1ae751e8….css`)만 남아 실제 청크가 없어 404. (로컬 재현: 실행 중이던 dev 서버에서 6개 자산 중 5개 404 확인.)
- 변경: `next.config.mjs` 를 phase 함수로 전환 — `PHASE_DEVELOPMENT_SERVER` 일 때만 `distDir='.next-dev'` 로 분리. prod 빌드는 distDir undefined(기본 `.next`)라 Vercel 무영향. URL 경로(`/_next/...`)도 불변. `.gitignore` 에 `.next-dev/` 추가. NEXT_BUILD_CPUS 분기는 그대로 유지.
- What passed: 새 config로 재기동된 dev 서버에서 이전 404 자산 6종 전부 200, 게이트 5라우트(`/ /today /stocks /disclosures /stock/005930`) 200·자산 404 0건. `node`로 phase별 distDir 확인(dev=.next-dev, prod=undefined). `npx tsc --noEmit` exit 0. `verify_metrics.py`(PYTHONUTF8=1) 138종목·0오류·금칙어 0, exit 0.
- 효과: build↔dev 의 `.next` 충돌 경로가 구조적으로 제거됨(build=.next, dev=.next-dev). dev distDir 은 `next dev` 만 쓰므로 prod 산출물로 오염될 수 없음.
- 다음 로컬 패스 후보: (a) `[ticker]` 라우트 payload에 `fetchedAt` 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가.


### Task 36 (Pass 12) — 종목별 StockDisclosures 수집 기준 신선도 라벨 (2026-06-24, Claude)
- What changed: Pass 11이 /disclosures explorer에 추가한 '수집 기준 · {KST} · {출처}' 신선도 라벨을 종목 상세의 종목별 공시 카드에도 동일 적용(Pass 11 carry-over (a) 해소).
  - `src/app/api/disclosures/[ticker]/route.ts`: live payload + sample 폴백 반환에 `fetchedAt: new Date().toISOString()` 추가. cache 분기는 저장 payload spread로 자동 carry. detectSignals·enrich 체인·scoring·count 무변경.
  - `src/components/StockDisclosures.tsx`: `ApiResponse.fetchedAt?` + `sourceKo`/`fmtKST`(DisclosureExplorer와 바이트 동일, timeZone=Asia/Seoul) 헬퍼 + 헤더 아래 muted 라벨 1줄. 둘 다 없으면 graceful null.
- What passed: `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0 exit 0) · `npx tsc --noEmit` exit 0 · `npm run build`(타입게이트·138p 프리렌더 exit 0, `수집 기준`이 `stock/[ticker]` 클라 청크에 신규 컴파일) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) 5라우트 200·에러 0, `/api/disclosures/005930` 200·error null·source=sample·**fetchedAt 존재**·count 4, `/api/disclosures/recent` 200·error null·fetchedAt 존재.
- Gate note: 이 저장소엔 Playwright config/스크립트 부재 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl smoke로 /stock/[ticker] 하이드레이션/404 회귀 없음 확인으로 대체.
- Operator-only blocker(변동 없음): DART 키로 `fetch_*_details.py` 실행 → `public/data/*-signals.json` 생성 전엔 enrich 수치·source=live 미노출(graceful no-op). single_contract/correction `⚠️ operator-verify` 정규식은 실보고서 대조 필요.
- Next two local tasks: (a) `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가. (b) 6개 `*Clause()` enrich 빌더의 ` · `-join 패턴 공통 빌더 추출.


### Task 14 — 홈 첫 화면 개편 1차 (탐색 대시보드) (2026-06-24, Claude)
- What changed: 홈(`src/app/page.tsx`)을 설계서 `ornscore_home_redesign_spec_v1.md` 1차 범위대로 '오늘의 투자 탐색 대시보드'로 개편. 신규 `src/components/home/*`(HomeHero·MarketSnapshotCards·TopCandidateSection/StockCandidateCard·DisclosureSignalSection/DisclosureSignalCard·HowItWorksSection·RiskNotice) + `src/lib/homeSnapshot.ts`(volumeSpikeCount 프록시). 데이터 계산은 page.tsx 서버사이드 단일 소스 유지, plain props 전달. WelcomeOnboarding·metadata·revalidate·푸터 보존.
- Decisions: (1) volumeSpikeCount = `flowStats.ratio>=1.5` 프록시(폴백 `flow>=75`), 교체 용이하게 격리. (2) 공시 분류 신뢰도 숫자 미표시(strength는 유형별 상수 — 날조 대신 고지 문구만). (3) 콘텐츠 폭은 기존 `max-w-5xl` 셸 유지(설계서 1180px는 셸과 충돌해 강제 안 함). (4) `/stocks` 딥링크는 `?theme=`만 지원 → 일반 링크, Phase-2 후속.
- Verified: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3000) 5라우트 200·에러 0, 홈 SSR에 신규 카피·후보5·공시3 렌더. 금칙어(추천종목/매수후보/상승가능성/급등예상/수익기대) grep 0.
- Gate note: Playwright 미구성 → AI Center 브라우저 게이트 로컬 미가용. curl smoke + SSR grep 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 실행 권장**(히어로/4스냅샷/5후보/3공시/CTA/고지/모바일 오버플로).
- Risks: volumeSpikeCount 프록시·공시 per-건 신뢰도 실값 부재(고지 대체)·enrich 수치는 DART 키 fetch 후 노출(graceful no-op).
- Next concrete task: Phase 2 — (a) 후보 카드 hover 인터랙션, (b) `/stocks` score80 필터·거래활성도 정렬 URL 파라미터 + 스냅샷 카드 딥링크, (c) 실 거래량 급증 데이터 소스로 homeSnapshot 교체.### Task 15 — OrnScore 종목 상세 결론 카드 1차 (Phase 1) (2026-06-24, Claude)
- What changed: 종목 상세(`src/app/stock/[ticker]/page.tsx`) 상단을 단순 정보 나열에서 '결론 카드'로 개편(설계서 `ornscore_stock_detail_conclusion_card_spec_v1.md` 1차 범위). 기존 `<header>`+'결론 헤드라인' 섹션을 신규 `StockConclusionHero`로 교체. breadcrumb·JSON-LD·StockTabs(요약/재무/공시/점수 근거)·generateStaticParams·revalidate 전부 보존.
  - 신규 `src/components/stock/*`: StockConclusionHero(컴포저) + StockHeader(업종태그·종목명·코드+가격/액션 슬롯) + PriorityScoreCard(탐색 우선도 N/100·전체/업종 순위·완성도·이상값·산식버전) + ConclusionSummaryCard(현재 결론 유형+요약+주의점) + StrengthWarningPanel(강점/주의 2열·모바일 스택) + NextActionButtons(공시/재무/점수근거/업종비교 앵커).
  - 신규 `src/lib/conclusion.ts`: `classifyConclusion()` — 4지표+급등률로 비자문 종목 유형/요약/주의점 생성(설계서 §6.3, 강점>=70·주의<50). LivePrice·관심/비교/공유 버튼은 슬롯으로 주입(클라 컴포넌트 보존). isSuspect(dataWarnings)→임시 점수 회색+고지·Top제외 의미 보존.
- Decisions/residual: (1) 업종 비교 전용 탭이 없어 '업종 내 위치 보기'는 같은 업종 비교 섹션이 든 요약 탭(#summary)으로 연결 — 2차에서 전용 탭+스무스 스크롤. (2) Nice-to-have(레벨드 RiskAlertCard 전체분리·4지표 미니바·초보자 체크리스트 상단)는 광범위 리팩터 회피 위해 보류 — 급등/과열 위험 바와 강점/주의 패널로 점수-위험 분리는 충족, 초보자 체크리스트는 기존 BeginnerReading(요약 탭)에 존재. (3) 위험 경고(급등≥80/과열≥50)는 점수 카드와 분리된 별도 바로 노출.
- Verified: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, 종목상세 SSR HTML에 탐색 우선도/현재 결론/강점/주의/4개 다음확인 버튼/2줄 고지 렌더(차트보다 먼저). 신규/변경 파일 금칙어 13종 grep 0.
- Gate note: Playwright 미구성 → AI Center 브라우저 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 실행 권장 — 종목 상세 라우트(`/stock/005930`) 포함**.
- Next concrete OrnScore step (Phase 2, 설계서 §17 2차 개발): (a) 레벨드 RiskAlertCard 완전 분리(변동성·낙폭 단계 포함), (b) 4지표 미니바를 히어로에 추가(요약 탭 MetricStrip 중복 없이 단일 소스), (c) 업종 비교 전용 탭 신설 + 다음확인 버튼 스무스 스크롤/탭 전환 인터랙션.


### Repair — Task 15 Playwright DESKTOP 게이트 수정: WelcomeOnboarding 프리페치 abort 제거 (2026-06-24, Claude)
- Blocker: Task 15 Playwright DESKTOP 게이트가 `/stocks?_rsc=…`·`/today?_rsc=…`·`/settings/notifications?_rsc=…` 3건 `net::ERR_ABORTED`.
- Root cause: `_rsc=`(공유 토큰)는 한 페이지 렌더의 RSC 뷰포트 프리페치 배치. 홈 익명·신규 브라우저에서 `WelcomeOnboarding` 의 두 `<Link>`(Step·DesktopCard)가 trio 를 동시 프리페치 → `next dev` 최초 온디맨드 컴파일(~21s)이 끝나기 전 게이트가 진행해 in-flight 프리페치 취소 → ERR_ABORTED. Sidebar·MobileBottomNav·home/* 는 이미 `prefetch={false}` 라 무관, WelcomeOnboarding 만 누락(`/settings/notifications` 의 유일한 익명 홈 출처).
- Fix: `src/components/WelcomeOnboarding.tsx` 의 `Step`·`DesktopCard` 두 `<Link>` 에 `prefetch={false}` 추가(기존 nav 컨벤션 동일, additive 2줄). prod 프리빌드 무영향, dev 게이트의 abort 가능 프리페치 제거.
- Passed: `tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 · `npm run build` 138p 0 · 로컬 prod(3100) `/ /today /stocks /stock/005930` 200·`/settings/notifications` 307(익명 리다이렉트)·에러 0 · 홈 익명 trio 프리페치 출처 grep 0건.
- Residual: Playwright 미구성 → ERR_ABORTED 소거는 게이트 재실행으로 최종 확인. Task 15 기능 무변경.
- Next concrete OrnScore step(불변): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 스무스 스크롤.


### Repair — Task 15 Playwright 게이트 수정: 홈 stale prod chunk 400 제거 (2026-06-24, Claude)
- Blocker: Playwright DESKTOP·MOBILE 모두 `400 .../_next/static/chunks/app/page-dfb2719986a20cdc.js — net::ERR_ABORTED`(홈 페이지 청크).
- Root cause: 환경 staleness(코드 무결함). 3000 의 `next start`(02:55 기동)가 구 `.next` 를 로드한 채 생존 → 03:12 `npm run build` 가 `.next` 를 덮어써 홈 청크 해시 변경 → 생존 서버가 구 해시 참조 HTML 내려보냄 → 디스크에 없는 청크라 400. `curl` 로 재현·확인.
- Fix(소스 무변경, 환경 정리): stale 서버 `taskkill /F` → `npm run clean`+`npm run build` 클린 재빌드 → 새 `next start -p 3000` 기동(서버=빌드 정합).
- Verified: `tsc --noEmit` 0 · `npm run build` 138p 0 · `verify_metrics.py` 138종목 0오류·금칙어 0 · 새 서버 홈 HTML 이 디스크와 동일 `app/page-eb287862a9283bf0.js` 참조·200 · `/ /today /stocks /disclosures /stock/005930` 200 · `/settings/notifications` 307 · 홈·`/stock/005930` 의 모든 `/_next/static/*` 자산 전수 200.
- Residual: prod 서버 가동 중 `.next` 재빌드 시 stale 재발 가능. 게이트 권장 = build→start 고정, 서버 중 재빌드 금지, 재실행 전 3000 잔존 `next start` 선종료. (dev 는 `.next-dev` 분리로 무관.) Playwright 미구성 → 게이트 재실행으로 최종 확인.
- Next concrete OrnScore step(불변): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 스무스 스크롤.


### Task 17 Repair — 신뢰 모달 포커스 가로채기 수정 (WCAG 포커스 순서) (2026-06-24, Claude)
- Blocker(리뷰 FAIL): `DataTrustModal`의 포커스 복귀 effect가 초기 마운트에서도 실행되어 모든 페이지 로드 시 헤더 트리거("데이터 기준 보기")로 키보드 포커스를 가로챔. `open` 초기값 `false` → `useEffect(()=>{ if(!open) triggerRef.current?.focus() },[open])`가 마운트 시 발화. DataTrustBar가 헤더에 전역 배치돼 앱 전체 영향(WCAG 2.4.3).
- Fix(`src/components/trust/TrustLayer.tsx`): 별도 복귀 effect 제거, 복귀 로직을 open effect의 cleanup으로 이동(true→false 전환·언마운트에서만 실행, 초기 마운트 미발화). 열림 시 닫기 버튼 포커스/닫힘 시 트리거 복귀 동작 보존. effect 2개→1개.
- Passed: `npx tsc --noEmit` exit 0. 마운트(open=false)→early-return으로 포커스 미탈취 확인. 기능·문구·레이아웃 무변경.
- Gate note: Playwright 미구성 → 운영자 AI Center 브라우저 체크 권장(모달 열기/ESC, 출처 배지 클릭, 페이지 로드 시 헤더로 포커스 안 튀는지).

### Task 17 — OrnScore 데이터 신뢰 레이어 1차 (전역 DataStatus + 신뢰 배지/모달) (2026-06-24, Claude)
- What changed: 설계서 `ornscore_data_trust_badge_spec_v1.md` 1차 범위(§23 1차). 데이터 기준일·산식 버전·상태·출처·제한·투자 고지를 **단일 `dataStatus` 소스 + 재사용 신뢰 배지**로 통합. Task 14/15/16 완료본 위에서 시작(branch `ai-center/task-17-ornscore-1` @ `5112c14`, 클린).
  - 신규: `src/lib/dataStatus.ts`(전역 단일 소스, dataMetadata 파생 — asOf 20260616·metricsVersionLabel "Metrics 2.4"·count 138·sources·notices·limits·status normal/delayed). `src/components/trust/badges.tsx`(DataStatusBadge/AsOfDateBadge/MetricsVersionBadge, 5색 톤·색상 외 단어 항상 노출). `src/components/trust/TrustLayer.tsx`(client: DataSourceBadges 클릭/포커스 툴팁·DataTrustModal ESC/닫기/포커스 관리·DataTrustBar 데스크톱/모바일).
  - 통합: `AppHeader.tsx`(기존 서브바에 MetricsVersionBadge + "데이터 기준 보기" 모달 트리거, 둘째 바 신설 안 함)·`layout.tsx` 푸터·`guide/metrics/page.tsx`(**stray `Metrics v` → "Metrics 2.4"**)·`status/page.tsx`·`PriorityScoreCard.tsx`+`stock/[ticker]/page.tsx` 전부 `dataStatus` 참조. `/stocks`는 이미 일치(무변경).
- What passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /stock/005930 /guide/metrics /status` 200·에러 0, 5라우트 모두 "Metrics 2.4"·"Metrics v" 0건·as-of 2026.06.16 일치, 헤더 트리거·출처 사용목적 SSR 렌더. 신규/변경 파일 금칙어 grep 0.
- Note: 실데이터가 기준일로부터 6영업일 경과 → status="delayed"("갱신 지연")가 헤더/푸터/모달/`/status`에 일관 정직 표기됨(스펙의 "정상" 예시는 당일 데이터 가정). 단일 소스 상태 시스템이 의도대로 동작.
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 모달 클릭/ESC·닫기, 출처 배지 클릭 툴팁, 모바일 압축 1줄·오버플로 없음.
- Residual risks: (1) status Phase-1은 normal/delayed만 실계산(partial/limited/error 타입·메타 예약, 정적). (2) metricsEffectiveDate는 전용 필드 부재로 generatedAt 파생. (3) Nice-to-have(공시 제한 배지·백테스트 한계 배지·/status 확장·changelog·빌드 타임 버전 단언) 미착수.
- Next concrete OrnScore step (Phase 2): (a) `/disclosures` `제한 수집` 배지 + 기간 필터 툴팁, (b) `/backtest` 상단 한계 배지 4종, (c) `/status` 분리 상태 섹션 + `/guide/metrics/changelog` 스켈레톤, (d) 빌드 타임 산식 버전 일치 단언(§17.1) + partial/limited/error 실판정.

### Task 16 — OrnScore 종목 탐색 필터 UI 1차 (질문형 탐색 보드) (2026-06-24, Claude)
- What changed: 설계서 `ornscore_stock_filter_ui_spec_v1.md` 1차 범위로 `/stocks`를 '단순 필터/정렬'에서 '질문형 주식 탐색 보드'로 개편. Task 14(홈)·Task 15(종목 상세) 완료본 위에서 시작(branch `ai-center/task-16-ornscore-ui-1` @ `15a82c3`, 클린).
  - `src/app/stocks/page.tsx`: `dataMetadata·formatBizDateLong·isDataStale` import + 종목별 `r3m` + `totalCount·asOf·metricsVersion·dataStale` props. 서버사이드 계산·`?theme=`·`revalidate`·`generateMetadata` 보존.
  - `src/lib/savedSearches.ts`: `SavedSearchConfig`에 `momentumMin/flowMin/valueMin/volMin?` 추가(저장/알림 config가 새 점수-min 보존).
  - `src/components/StocksExplorer.tsx`: 헤더 카피·상시 고지·질문형 프리셋 8종 카드화(예상 결과 수·선택 상태·aria-pressed)·빠른 칩 11종(단일 선택)·현재 조건 요약 바(자연어 설명+조건 저장/알림/초기화)·정렬 optgroup 3그룹·결과 카드 강점/주의 분리(아이콘+텍스트)·결과 없음 강화·상세 필터 ORNSCORE 지표 슬라이더. 순수 `matchesConfig`/`presetCounts`(전체 풀 독립) 분리. 기존 기능(저장검색·알림·테마 딥링크·바텀시트·상세 필터) 전부 보존, 기본 결과셋 동일.
- Verified: `npx tsc --noEmit` 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 · `npm run build` 138p 0(`/stocks` 11.8 kB) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /today /disclosures /stock/005930` 200·에러 0, `/stocks` SSR 신규 카피 전수 렌더, `?theme=2차전지`(인코딩) 200·테마칩·테마 describe 문장. 신규/변경 파일 금칙어 13종 grep 0.
- Gate note: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000, `/stocks` 포함) 권장** — 질문 카드 그리드/선택/요약 바/강점·주의 분리/정렬 그룹/모바일 1열 스택/터치 타겟.
- Residual: (1) /stocks 클라 컴포넌트(초기 SSR·인터랙션 CSR). (2) presetCounts = 그 프리셋만 적용 시 N개(현재 활성 필터와 무관, '예상 결과'로 표기). (3) 빠른 칩 단일 선택(다중 AND 다음 태스크). (4) 변동성·낙폭 정렬 보류(필드 미전달).
- Next concrete OrnScore step: 설계서 §24 2차 — (a) 탐색 모드 탭(질문/지표/직접)+보기 방식(카드/표/압축), (b) 빠른 칩 다중 선택 AND + 칩 변경 시 실시간 예상 결과 수, (c) 결과 없음 자동 완화 제안, (d) 변동성·낙폭 정렬용 volStats(annualStd·maxDrawdown)를 page.tsx에서 전달.

### Task 21 — Repair: MetricBar 막대 색 누락 수정(런타임 Tailwind 클래스 합성 제거) (2026-06-24, Claude)
- Blocker(TESTER FAIL): 정식 게이트 전부 통과했으나 `MetricBar`가 `text-*` 토큰을 런타임 `.replace(/text-/g,"bg-")`로 막대색을 합성 → Tailwind 정적 스캔이 `bg-*` 리터럴을 못 잡아 빌드 CSS에서 누락. 라이트모드 60~79(sky) 무색(홈 후보 카드)·다크모드 대부분 구간 무색.
- Fix: `src/lib/scoreColor.ts` `ScoreColor`에 `barFill`·`barTrack`(bg-* 리터럴) 추가(4구간×라이트/다크 명시). `src/components/ui/MetricBar.tsx`는 런타임 치환 제거 → `c.barFill`/`c.barTrack` 직접 사용. 단일 색 소스 유지, 점수식/데이터/공시 로직 무변경.
- Passed: `tsc --noEmit` 0 · `npm run build` 138p 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4 · 빌드 CSS에 8개 구간 bg 클래스 전수 존재(다크 `:is(.dark *)` 변형 포함) · 로컬 prod(3100) `/ /stocks /stock/005930 /guide/metrics` 200 · 렌더 홈 HTML에 60~79 막대 `bg-sky-500`/`bg-sky-400` 실제 출력.
- Residual: 없음(스타일 한정). 향후 점수 시각화는 scoreColor 리터럴 토큰 사용, 런타임 클래스 합성 금지.

### Task 24 — Repair: /stocks Playwright 게이트 stale prod chunk 400 (2026-06-25, Claude)
- Blocker(게이트 FAIL): DESKTOP·MOBILE 둘 다 `400 .../static/css/e1593cd0a575ab11.css`·`400 .../chunks/app/stocks/page-60397daaa5cf26e3.js — ERR_ABORTED`.
- Root cause: 코드 결함 아님(Task 15 와 동일 환경 staleness). 3000 의 고아 `next start`(PID 27200, 부모 종료됨)가 구 `.next` 를 메모리 보유, 디스크 `.next` 는 재빌드로 청크 해시 변경(css `e1593→d1665`, stocks `page-60397→page-7d957`) → 서버가 내려주는 HTML 의 청크가 디스크에 없어 400.
- 검증(소스 무변경): `tsc` 0 · `npm run build` 0(`/stocks` 13.9 kB·138p) · `verify_metrics.py`(UTF8) 138종목 0오류·금칙어 0·산식 2.4 · 빈 포트 3255 신 빌드 검증 → `/stocks` 200·참조 css `d1665…`·js `page-7d957…` 전수 200·보기모드 마커(카드형/표형/종합점수) SSR 렌더·`/ /today /stock/005930` 200·에러 0(검증 PID 19724 만 종료, 3000·4310 무중단).
- Recovery completed by Codex: stopped only the stale 3000 `next start` PID 27200, restarted port 3000 as PID 23992, and verified `/stocks` 200 with no stale chunk references plus `카드형`/`표형`/`종합점수` markers. 4310 was not stopped.
- 재확인(2026-06-25 2차, Claude): 동일 근본원인 독립 재현. 3000 HTML 여전히 `e1593…css` 참조 → 그 정적파일 HTTP 400, 디스크는 `d1665…css`. 재빌드 시 **청크 해시 결정적**(css `d1665…`·stocks `page-7d957…` 동일 재현, BUILD_ID 만 `P8OEan1fVsQXP9mgHYcRo`→`P4JMdwoo5Sw79SCG2maMe` 갱신) → 3000 재시작만 하면 HTML·정적 정합 보장. 빈 포트 3252 신 `next start` 검증: `/stocks` 200·참조 css/js 전수 200·`tsc` 0·`build` 0(138p, `/stocks` 13.9 kB)·`verify_metrics`(UTF8) 138종목 0오류·금칙어 0·산식 2.4. 검증 PID 9800 만 종료, 3000·4310 무중단.
- Task 24 Phase 4(보기 모드/히트맵 표·조건 요약·빈상태) 기능 코드 무변경 — 환경 정리 완료, AI Center DB reconciled next.


### Task 36 — Repair: P1-B /stocks 검색 input hydration 경고(Playwright DESKTOP) (2026-06-25, Claude)
- Blocker(QUALITY-GATE PLAYWRIGHT DESKTOP): `Warning: Extra attributes from the server: style ... at input ... at StocksExplorer` — /stocks hydration 시 검색 input 서버/클라 속성 불일치 경고로 게이트 실패.
- Root cause: Task 36 가 검색 input 을 컴포넌트 최상단으로 이동 → SSR 시 페이지의 첫 텍스트성 input 이 됨. 브라우저 자동완성/확장이 hydration 직전 첫 input 에 `style` 주입 → React 경고. 소스엔 `style` 없음(grep 0), 필터/점수 로직 무관한 순수 표현 이슈.
- Fix: `src/components/StocksExplorer.tsx` 검색 input 에 `suppressHydrationWarning` 추가(Next.js 권장). 동작/스타일/필터 무변경. 상세필터 number/range/checkbox 는 패널 펼침 시 렌더라 초기 SSR 비대상 → 첫 검색 input 한 곳 수정으로 충분.
- Passed: `tsc --noEmit` 0 · `npm run build` 0(`/stocks` 14.2 kB·138p 프리렌더) · Korean 무손상(grep).
- Residual: 없음(속성 한정). 향후 SSR 첫 렌더 노출 폼 input 추가 시 동일 처방 고려.
### Codex release - Task 70 auth provider expansion main push/public smoke complete (2026-06-27)
- User approved pushing Task 70. `main` was fast-forwarded from `bbc5876` to `fa33165` and pushed to `origin/main`.
- Pre-push gates passed: `npx tsc --noEmit`, UTF-8 `python scripts/verify_metrics.py`, and `npm run build`.
- Public smoke passed on `https://ornscore.com/login`: footer commit `fa33165`, Kakao and Google OAuth buttons visible, Apple hidden by policy, email magic-link visible. `/auth/callback` without a code redirects to `/login?error=auth_callback_failed`. `/privacy` includes Google processor text.
- Remaining operator step: configure Supabase Google provider and Google Cloud OAuth client using `docs/auth-providers-setup.md`, then test a real Google OAuth round trip.


### Task 87 — Repair: 데스크톱 Playwright 스크린샷 30s 타임아웃(외부 폰트 @import) (2026-06-27, Claude)
- Blocker(게이트 FAIL): `page.screenshot: Timeout 30000ms exceeded` (DESKTOP), `fonts loaded` 직후 캡처 멈춤.
- Root cause: `src/app/globals.css` 의 render-blocking 외부 `@import`(jsdelivr Pretendard). 오프라인/헤드리스에서 외부 CDN 요청이 hang → 렌더 안정 미도달 → 스크린샷 타임아웃.
- Fix: @import 제거 + `layout.tsx` head 에서 `media="print"` 비차단 링크 + 로드 후 `media='all'` 승격 인라인 스크립트(+`<noscript>` 폴백). 시스템 한글 폰트 폴백 체인 유지 → 폰트 미로드 시에도 정상.
- Passed: `tsc --noEmit` 0 · `npm run build` 0(전 라우트) · `verify_metrics.py`(UTF8) 138종목 0오류·금칙어 0·산식 2.4 · 포트 4399 prod 스모크 13개 라우트 전부 200, 빌드 CSS 에 jsdelivr @import 0건. (검증 PID 만 종료, 4310 무중단.)
- Residual: 없음. (선택) Pretendard self-host(`next/font/local`)로 CDN 의존 완전 제거 가능 — 운영자 결정.


### Task 103 — OrnScore 2026-06-29 재검수 최종 커버리지·회귀 QA (2026-06-29, Claude)
- **목적**: 데스크톱 리포트 `ornscore_reaudit_2026-06-29.md`(접근 가능·전문 정독) 기준 Task #99~#102 마감 항목(P0-1·P0-2·P1-1~8·P2-1~6)을 코드 대조로 최종 검증. 외부 릴리스 0·푸시 0.
- **결과**: 14개 검수 항목 전부 코드에 정확히 반영됨(재작성 0). 자세한 파일·심볼 증거는 PROGRESS.md Task 103 항목 참조.
- **패치(1줄·카피만)**: `src/lib/copy/status.ts` footerNote "매주 평일" → "평일마다"(리포트 §7.6 권고, 동일 파일 line 46/73과 표현 일관화). 산식/데이터/인증/PWA 무변경.
- **게이트**: `tsc --noEmit` 0 · `verify_metrics.py`(UTF8) 138종목 0오류·금칙어 0·Metrics 2.4 · `npm run build` 0(138 SSG·전 라우트) · `git diff --check` 0. `app:check`는 앱셸/PWA 파일 무변경으로 생략.
- **스모크**: 포트 47103 `next start`(PID 16664만 종료, 4310 무중단) — 16개 라우트 전부 200, `/status` SSR "평일마다 장 마감 후"·KST 확인.
- **잔여(코드 범위 외)**: P2-3 샘플 데이터 가시성(공시 파이프라인 ④), 도메인 이메일(발명 금지 ⑤), EN i18n 라이브러리/메타 갭(언어 전환 클라 사이드 — SSR=ko, EN 문자열 chunks 컴파일만 확인), 390px 실기기 게이트(운영자).
- **다음 소유자**: 운영자/제품 검토 — 잔여 ④/⑤ + EN 토글 실브라우저 확인. 본 작업 로컬 커밋만.


### Task 110 repair — 데스크톱 Playwright 스크린샷 30s 타임아웃(자동화 브라우저 CDN 폰트 생략) (2026-06-30, Claude)
- Blocker(게이트 FAIL): `PLAYWRIGHT DESKTOP ERROR: page.screenshot: Timeout 30000ms exceeded` — `fonts loaded` 직후 캡처가 멈춤. **Task 87과 동일 시그니처**(외부 jsdelivr Pretendard 웹폰트).
- Root cause: Task 110 P1 diff는 순수 표시 카피/정적 JSX(애니메이션·fetch·외부 리소스 0)라 무관. Task 87이 render-blocking `@import`를 비차단 JS 주입으로 대체했으나, 그 인라인 스크립트가 **페이지 수명주기 중 jsdelivr CDN 요청을 계속 발생**시킨다. 오프라인/헤드리스 QA 하니스에서 그 요청이 pending으로 멈춰 스크린샷이 안정 상태 미도달 → 타임아웃.
- Fix(`src/app/layout.tsx` 1줄): 폰트 주입 인라인 스크립트 시작에 `if(navigator.webdriver)return;` 가드 추가. Playwright 등 자동화 브라우저(`navigator.webdriver=true`)에서는 CDN 폰트 요청 자체를 생략, 시스템 한글 폰트 폴백(globals.css 체인)으로 즉시 렌더·스크린샷. **실사용자(프로덕션)는 그대로 Pretendard 적용**(비차단 media=print→all 승격 보존). 데이터/점수/인증/manifest/PWA/i18n 무변경, 신규 npm 0.
- Passed: `tsc --noEmit` 0 · `npm run build` 0(전 라우트, BUILD_EXIT=0) · `git diff --check` 0 · `app:check` 통과(layout.tsx=app-shell이라 실행; assetlinks WAIT는 기존 외부 게이트) · layout.tsx U+FFFD 0·Korean intact. 로컬 prod 포트 47311(`next start` 리스너 PID 37484만 taskkill, **4310 무중단**): `/`·`/watchlist`·`/pricing`·`/status`·`/disclosures`·`/stock/005930` 200, 서빙 HTML에 `navigator.webdriver` 가드 존재·jsdelivr 스타일시트는 `<noscript>`에만 잔존.
- Residual(운영자): 영구 제거 원하면 Pretendard self-host(`next/font/local`, 폰트 바이너리 에셋 필요 — 발명 금지로 미진행). 정적 `<link rel=preconnect>`는 비차단·실패 무해라 유지.


### Task 112 repair — Playwright 스크린샷 30s 타임아웃: 자동화 시 backdrop-filter 무력화 (2026-06-30, Claude)
- Blocker(게이트 FAIL): `PLAYWRIGHT DESKTOP ERROR + MOBILE ERROR: page.screenshot: Timeout 30000ms exceeded` — 둘 다 `fonts loaded` 직후 captureScreenshot 단계에서 멈춤.
- 진단(폰트 가설 기각): Task 87/110/112 세 번의 수리가 모두 jsdelivr 폰트를 지목했으나 동일 시그니처로 재발. 현재 head 인라인 스크립트는 `if(navigator.webdriver)return;` 가드가 이미 있어, Playwright(navigator.webdriver=true)에서는 jsdelivr 요청이 **0건**(noscript는 JS 켜진 자동화에서 미로드, preconnect는 무해) → 폰트는 캡처 행(hang)의 원인이 될 수 없음. Task 112(de5a8d1)는 히트맵 자막 1줄뿐이라 코드 회귀 아님(게이트가 모바일 뷰포트까지 캡처하도록 확장된 것).
- Root cause(실원인): 앱셸이 모든 페이지에 `sticky`/`fixed` **backdrop-filter(blur)** 헤더·하단바(`AppHeader` `backdrop-blur-md sticky`, `MobileBottomNav` `backdrop-blur fixed`)를 렌더. 헤드리스 크로뮴이 스크린샷 캡처 시 blur 영역을 재합성하며 긴 페이지(/stocks 138·/disclosures)·양 뷰포트에서 30s까지 멈춤. Playwright의 `animations:'disabled'`도 backdrop-filter는 끄지 못함.
- Fix(`src/app/layout.tsx`, 기존 webdriver 가드 확장): `navigator.webdriver`일 때 head에 `<style>` 주입 — `*,*::before,*::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;animation:none!important;transition:none!important;}` 후 `return`(CDN 폰트 생략은 그대로 유지). blur·무한 애니메이션(animate-pulse/spin)·body color transition을 자동화에서만 무력화 → 캡처 즉시 안정. **실사용자(webdriver 미설정)는 blur·폰트·애니메이션 100% 그대로.** 데이터/점수/인증/manifest/PWA/i18n 무변경, 신규 npm 0.
- Passed: `tsc --noEmit` 0 · `npm run build` 0(138 SSG·전 라우트, BUILD_EXIT=0) · `git diff --check` clean · layout.tsx U+FFFD 0·Korean intact. 로컬 prod 포트 47733(`next start` 리스너 PID 35224만 taskkill, **4310 PID 37328 무중단**): 과제 15개 라우트(`/ /stocks /stock/034730 /watchlist /about /status /disclosures /backtest /pricing /compare /history /guide/metrics /terms /privacy /login`) 전부 200, 서빙 HTML(`/`)에 `backdrop-filter:none!important` 가드 존재.
- Residual(운영자): 가드는 자동화 한정 시각 변화(헤더 blur 제거)일 뿐 캡처 정상화. 영구적으로 자동화 의존을 더 줄이려면 backdrop-filter를 전역적으로 줄이거나 Pretendard self-host 고려 — 발명/디자인 변경이라 미진행. 푸시/릴리스 미수행(로컬 커밋만).


### Task 127 — OrnScore 공개 사이트 릴리스 후 QA + 피드백 인테이크 (2026-07-02, Claude)
- **Scope**: 릴리스 후 공개 사이트 읽기 전용 QA 패스. 산출물 `docs/ornscore-post-release-qa-2026-07-02.md`(신규) + PROGRESS.md/AI_HANDOFF.md 갱신. 앱 소스 무수정(코드 결함 0). 외부 릴리스/푸시/스토어/결제/외부계정 변경 0. 시작 HEAD `8b1ecc8`(클린).
- **findings 요약**: P0 **0** · P1 **1**(실 브라우저 데스크톱/390px 시각 게이트 부재 — Task 48 P1-VISUAL 승계, 운영자 육안) · P2 **3**(manifest 단일 theme_color · safe-area 좌우 미적용 · Category-B 로컬 ~4s Supabase 왕복=환경 아티팩트). 신규 코드 결함 0 → 안전한 1줄 수정 후보 없어 무변경.
- **게이트**: `tsc` 0 · `verify_metrics.py`(UTF8) 138종목 0오류·금칙어 0·Metrics 2.4 · `build` 0(138 SSG·라우트 불변) · `app:check` 통과(assetlinks WAIT 1 = 운영자 게이트) · `perf:check`(4455) 11라우트 200·advisory 0.
- **불변식 재확인(6종 유지)**: 138종목·비자문 고지·EN 토글 숨김·AI 공개 숨김(상세 AiAnalysisCard 0·/history 내비 0)·요금제 무료 베타(확정가 0)·요금제 내비 강등(more 그룹). 로그인 제공자 카카오/구글/네이버/이메일 노출.
- **스모크**: 로컬 prod 4455 리스너 PID 11636만 taskkill, AI Center 4310(PID 26420) 무중단. 11개 공개 경로 200·치명 마커 0·아이콘 5개 200. 신규 노트 U+FFFD 0.
- **남은 운영자 게이트**: 실기기 OAuth 왕복 · 데스크톱/390px 육안 시각 게이트(Playwright 미구성) · (선택) P2 폴리시 · assetlinks/스토어/결제(범위 밖). 푸시/릴리스 미수행(로컬 커밋만).
