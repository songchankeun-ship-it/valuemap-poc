<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-06-23T03:25:21.646Z
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

- Task: 31 - OrnScore 자동 이어가기
- Run: 40
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
