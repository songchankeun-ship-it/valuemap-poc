<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-06-23T17:09:12.097Z
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

- Task: 14 - OrnScore 홈 첫 화면 개편 1차
- Run: 20
- Status: completed
- Agent: claude
- Note: Development and all quality gates completed.

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
- Next concrete task: Phase 2 — (a) 후보 카드 hover 인터랙션, (b) `/stocks` score80 필터·거래활성도 정렬 URL 파라미터 + 스냅샷 카드 딥링크, (c) 실 거래량 급증 데이터 소스로 homeSnapshot 교체.
