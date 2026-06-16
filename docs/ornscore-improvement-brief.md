# ORNSCORE Improvement Brief

Source: `C:\Users\dongy\OneDrive\바탕 화면\ORNSCORE 사이트 진단 및 개선 설계서.pdf`

This brief converts the PDF diagnosis into an automation-ready implementation target for AI Dev Center. Work locally only. Do not deploy, push, send emails, contact users, change DNS, modify payment setup, or transmit sensitive data.

## Product Direction

ORNSCORE is not a stock recommendation service, a trading signal room, or a broker-like app. It should be positioned as:

> A daily Korean stock exploration dashboard that helps users narrow thousands of stocks down to the few candidates and disclosures worth checking after market close.

Primary user value:

- Save time.
- See today's candidates quickly.
- Understand why a stock deserves further review.
- Track watchlist changes.
- Connect stock scores with DART disclosure signals.
- Keep investment responsibility and non-advisory boundaries clear.

Avoid copy that suggests guaranteed returns, buy/sell recommendations, or investment advice.

## Must Preserve

- Korean stock focus.
- Beginner-friendly Korean explanations.
- Open score methodology.
- Data status / data quality transparency.
- Clear non-recommendation stance.
- DART disclosure signals connected to stock pages.
- Legacy localStorage migration from old ValueMap keys.

## P0 Issues

### P0-1. Data Snapshot Consistency

Problem:

- Some pages can show different market close dates or metric versions.
- This is the biggest trust issue for a financial data product.

Implementation target:

- Ensure Header, Footer, Home, Today, Universe/Stocks, Stock Detail, and Status use one shared data metadata source.
- The displayed market date and metrics version must be consistent.
- If data is stale or update failed, show a clear "using last successful data" style warning instead of silently mixing dates.

Acceptance:

- Top/bottom market date is the same across key pages.
- Metric version is the same across key pages.
- Stock detail score matches the stock list/universe score for the same ticker.

### P0-2. Empty States for Watchlist and Compare

Watchlist empty state should explain value, not look like loading or failure.

Required copy/structure:

- Title: "아직 관심 종목이 없습니다"
- Explain that saved stocks let users track daily score changes and disclosure signals.
- CTAs:
  - "종목 탐색하러 가기"
  - "오늘의 후보 보기"
  - "로그인하고 여러 기기에서 동기화하기"

Compare empty state should explain how to begin.

Required copy/structure:

- Title: "비교할 종목을 선택하세요"
- Explain users can compare up to 4 stocks by score, PER/PBR/ROE, returns, and risk.
- CTAs:
  - "오늘 Top 5에서 고르기"
  - "같은 업종에서 고르기"
  - "직접 검색하기"

Acceptance:

- Loading does not appear forever.
- Empty states show at least two next-action buttons.
- Logged-out users understand what works locally and what login adds.

### P0-3. Non-Recommendation Copy Balance

Problem:

- Legal safety copy is important but can overpower the product value.

Implementation target:

- Keep non-advisory copy in footer, metric guide, stock detail warnings, and AI analysis areas.
- Home hero should lead with value first, then safety copy.
- CTA wording should stay non-advisory:
  - "오늘 볼 후보 확인"
  - "왜 점수가 높은지 보기"
  - "공시 원문 확인"
  - "같은 업종과 비교"
  - "관심종목에 저장"

Acceptance:

- Home hero shows user value before warning language.
- No buy/sell/recommendation language is introduced.

## 1st Priority Improvements

### Home Page

Goal: users should understand the product in 5 seconds.

Preferred hero message:

- Main: "2,500개 한국 주식 중 오늘 볼 종목을 10개 이하로 줄이세요."
- Support: "가격 흐름, 거래량, 밸류, 위험, 공시 신호를 한 번에 보고 오늘 확인할 후보를 정리합니다."

First screen should contain:

- Data 기준 pill.
- Strong primary CTA: "오늘 후보 5개 보기".
- Secondary CTA: "내 조건으로 찾기".
- Real data preview, such as Top 3 candidate cards.
- Safety note after value is visible.

Improve "why ORNSCORE" into three tighter cards:

- 종목 압축
- 산식 공개
- 공시 연결

Add beginner usage flow:

1. 오늘 후보 보기
2. 점수 근거 확인
3. 공시/재무 확인
4. 관심종목 저장 후 변화 추적

### Today Page

Treat `/today` as a daily dashboard.

Ideal sections:

- Today's market summary.
- Today's candidates.
- Things to watch today.
- Disclosure signals.
- Watchlist changes, or a logged-out sample preview.
- Checklist:
  - 급등 이유 확인
  - 업종 비교
  - 공시 원문 확인
  - 재무 추세 확인

Each stock card should include a one-line reason why it is a candidate.

### Stock Explorer

Emphasize question-style presets:

- 싸고 거래 늘었나?
- 돈 잘 버는 회사?
- 배당 주는 우량주?
- 대형주 안정형?
- 숨은 소형 저평가?
- 최근 공시 있는 종목?

Show active filter chips:

- PER <= 200
- PBR <= 30
- 거래정지 제외
- 결측 제외
- 분석 대상 count / visible count

Keep mobile list card-friendly. Avoid desktop-like dense tables on small screens.

### Stock Detail

Target structure:

- Stock identity and market/sector.
- Price, change, 기준일.
- 탐색 우선도.
- Sector rank.
- Risk tags.
- Watchlist/compare/share.
- "왜 이 점수인가?" cards:
  - 추세
  - 거래활성도
  - 밸류
  - 위험조정
- Recent changes:
  - score delta
  - rank delta
  - price delta
  - volume delta
  - recent disclosures
- Beginner interpretation:
  - "이 종목은 이런 유형입니다"
  - "먼저 확인할 것 3개"
  - "주의할 것 3개"

AI analysis should be phrased as checklist/support, not recommendation.

### Disclosure Signals

Improve disclosure cards with:

- Disclosure type.
- Stock name/code.
- Whether it is in ORNSCORE universe.
- Date.
- Extracted key values when available.
- Original DART link.
- Stock detail link.
- Add to watchlist.

Keep language clear that classification confidence is not good/bad scoring.

### Watchlist

Position as "내 종목 변화 추적판", not simple saving.

Logged-out state should show sample dashboard preview:

- Score change.
- Rank change.
- New disclosure.
- Volume spike.
- Risk change.
- AI analysis record.

Login value should be "변화 알림" more than just "sync".

### Compare

The compare page must allow starting from inside the page:

- Direct stock search.
- Pick from today's Top 5.
- Pick from watchlist.
- Pick from same sector where feasible.

Make the max 4-stock limit clear.

Mobile:

- Avoid wide horizontal tables.
- Prefer cards or a fixed-base-stock comparison pattern.

### Pricing

Position:

- Free: exploration.
- Pro: change alerts and analysis records.

Pro value should focus on:

- Time saving.
- Not missing changes.
- Record keeping.

Do not claim return improvement.

Waitlist form should be visible and have success feedback.

## Terminology

Use these consistently:

- Top score name: "탐색 우선도"
- Secondary: "종합 점수"
- List CTA: "후보 보기"
- Disclosure: "공시 신호"
- DART confidence: "분류 신뢰도"
- Caveat: "호재/악재 점수가 아님"

## Mobile Requirements

- Home hero should be two lines or less.
- One primary CTA should dominate.
- At least one real candidate card should be visible in the first mobile viewport where feasible.
- Stock explorer should be card/list based on mobile.
- Filters should behave like a bottom sheet or clear collapsible panel.
- Stock detail touch targets should be at least 44px where practical.
- Compare should not depend on wide horizontal tables on mobile.

## Design Tone

- Calm.
- Data-centered.
- Trustworthy.
- Beginner-friendly.
- No hype.
- No investment stimulus.

Use colors by meaning:

- Up/positive movement.
- Down/risk warning.
- Neutral.
- Data/trust.
- Premium/Pro.

Avoid making high scores look like direct buy signals.

## Automation Scope For Pass 1

For the first automated pass, prioritize only:

1. Data date / metric version consistency checks and fixes.
2. Watchlist empty state.
3. Compare empty state and start UX.
4. Home hero messaging and first-screen clarity.
5. Today page section clarity if feasible.
6. Visible ValueMap/old-brand residue cleanup.
7. Build and browser verification.

Do not attempt the entire roadmap in one pass.

## Verification

Required:

- `npm run build`
- Browser check: `http://127.0.0.1:3000`
- Manual route smoke checks if feasible:
  - `/`
  - `/today`
  - `/stocks`
  - `/stock/005930`
  - `/watchlist`
  - `/compare`
  - `/disclosures`
  - `/backtest`

Record in the task summary:

- What changed.
- What could not be completed.
- Remaining risks.
- Suggested next automated pass.
