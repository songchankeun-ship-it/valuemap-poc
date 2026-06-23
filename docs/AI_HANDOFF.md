<!-- AI-DEV-CENTER:PROJECT-HANDOFF:v1:BEGIN -->
# AI Handoff

Last updated: 2026-06-23T00:08:41.630Z
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

- Task: 27 - OrnScore Pass 7 disclosure capital/CB core-number expansion
- Run: 36
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
