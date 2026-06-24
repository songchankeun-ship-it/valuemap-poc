<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-06-24T03:35:54.290Z
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

- Task: 17 - OrnScore 데이터 신뢰 배지 1차
- Run: 23
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
