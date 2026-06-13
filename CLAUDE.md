# ValueMap (밸류맵) 프로젝트 인수인계 문서

> 이 파일은 Claude(나)가 송찬근 송님의 ValueMap 작업을 다른 PC/세션에서 매끄럽게 이어가기 위한 인수인계 문서입니다.
> 다른 PC에서 Claude(Cowork mode)를 시작하면, 이 파일을 첫 메시지로 보여주세요.

---

## ⏱️ 지금 상태 한눈에 (2026-06-13 갱신)

- **종목 탐색 필터 강화** → ✅ 코드 완성, tsc 통과. **아직 push 안 됨** → 송님이 적용+push 하면 끝.
- **백테스트 실데이터 엔진** → ✅ 엔진/페이지 완성. **5년 가격 데이터 수집 후** `run_real.py` 돌리면 자동 활성화.
- **브랜드 마이그레이션** → ⏸️ 도메인 미결정 대기 (아래 도메인 섹션 참고).

### ▶ 다음 세션에서 바로 할 일 (우선순위)
1. 송님이 두 작업(필터 / 백테스트)을 push 했는지 확인 → 안 했으면 `handoff/적용방법.md` 순서대로 적용 지원.
2. push 후 운영 사이트(valuemap.kr)에서 결과 확인.
3. 그다음 후보: 공시 신호 고도화 / 검색 콘솔 준비 / 도메인 결정 후 브랜드 마이그레이션.

---

## 👤 사용자 정보
- **이름**: 송찬근 (Song) / **이메일**: songchankeun@gmail.com / **회사**: 필로소디
- **대화 언어**: 한국어 (친근한 반말, "송님" 호칭)
- **작업 스타일**: 적극적 푸시 선호, 빠른 행동, 친근한 톤. 작업 끝에 격려/이모지 OK.

---

## 🌐 프로젝트 개요
- **사이트명**: 밸류맵 (ValueMap) / **배포 URL**: https://valuemap.kr (운영 중)
- **GitHub**: https://github.com/songchankeun-ship-it/valuemap-poc
- **브랜치**: `main` (push 시 Vercel 자동 배포)
- **로컬 작업 폴더(구 PC)**: `C:\Users\csgk0\Desktop\새 폴더\04_poc_app` (PC 바뀌면 경로 달라짐)

### ⚠️ 진행 중: 브랜드 마이그레이션 (도메인 미결정)
- "밸류맵"이 부동산 앱과 충돌(50만+ DAU) → 이름 변경 결정.
- 후보 1: **KSift (케이씨프트)** — 독창적, 충돌 적음. 여전히 유력.
- 후보 검토: **`valuefit.com` → 비추천** (2026-06-13 확인)
  - 이미 등록된 도메인(파킹 상태)이라 신규 구매 불가, 프리미엄 협상 필요.
  - "Valuefit" 상표 충돌: HELLA(자동차 조명) 제품라인 + valuesfit.com(채용 서비스).
  - 의미 약함: 영어로 "피트니스/가치매칭" 느낌, 주식·투자가 안 읽힘.
- 대안 .kr 후보(미확인): valuescope.kr, valpick.kr, valuesight.kr 등.
- **도메인 구매·결제는 송님 본인이 가비아에서 직접.** 확보되면 사이트 전체 마이그레이션 작업.

---

## 🛠️ 기술 스택
- **Framework**: Next.js 14 App Router (server components)
- **Styling**: Tailwind CSS v4 (다크모드 `darkMode: "class"`, next-themes)
- **DB**: Supabase PostgreSQL + RLS / **Auth**: Magic link + Kakao OAuth
- **Email**: Resend REST API (fetch) / **Deploy**: Vercel / **Cron**: vercel.json
- **Data**:
  - `public/data/stocks.json` — 138개 종목 메타데이터 (asOfBusinessDate 포함)
    - 필드: ticker, name, market, marketCap, currentPrice, changePct, per, pbr, roe, eps, bps, dividendYield, beta, peg, momentum, flow, value, volScore, compositeScore, themes ...
  - `public/data/prices/{ticker}.json` — 종목별 가격 시계열 (현재 1년, **5년으로 확장 예정**)
  - `public/backtest-result.json` — 백테스트 결과 (realData 플래그로 mock/실데이터 구분)
  - Supabase `daily_scores` 테이블 — 일별 점수 히스토리
- Python: FinanceDataReader, yfinance, pandas

---

## 📊 4대 지표 + 공시 신호 (서비스 핵심)
- **자체 지표 4종**: 모멘텀(1·3·6개월 가중수익) / 자금흐름(거래량비) / 밸류(PER·PBR 분위) / 변동성조정(Sharpe)
- **DART 공시 5종 신호**: 자기주식취득 / 임원·주요주주 매수 / 정정공시 / 단일판매·공급계약 / 유상증자·CB

---

## ✅ 완료된 주요 작업

### 기존 (이전 세션)
SEO 패키지(sitemap/robots/JSON-LD), 주가 SVG 차트, 신뢰 디테일(기준일 통일), 첫 사용자 온보딩,
⭐초보자 해석 레이어(BeginnerReading), ⭐공시 신호 차별화(signalGuide/SignalGuideExpand),
알림 시스템(cron/notify), 점수 변화 차트(ScoreHistoryChart), 다크모드, 정적 페이지(about/terms/privacy),
+ 추가 라우트: backtest, blog, guide, history, theme, AiAnalysisCard, GlobalSearch.

### 🆕 2026-06-13 세션 (이 핸드오프와 함께 전달, 아직 push 전)
- **종목 탐색 필터 강화** (외부 피드백 3순위 ✅)
  - `src/components/StocksExplorer.tsx` — 시장(코스피/코스닥)·시가총액 구간(대형5조+/중형/소형)·ROE 최소·배당수익률 최소·적자제외(EPS>0) 필터 추가. 질문형 프리셋 5종("싸고 거래 늘었나?","돈 잘 버는 회사?","배당 주는 우량주?","대형주 안정형?","숨은 소형 저평가?"). 정렬에 ROE/배당/시총 추가, 카드에 시총·배당 표시, 다크모드 보강.
  - `src/lib/realStocks.ts` — eps 매핑 추가.
  - `src/app/stocks/page.tsx` — marketCap/market/dividendYield/eps 전달.
  - ※ "관리종목 제외"는 stocks.json에 flag 없어 보류(추후 데이터에 flag 추가 시 가능).
- **백테스트 실데이터** (외부 피드백 5순위 — 엔진 완성, 데이터 대기)
  - `scripts/fetch_prices.py` — 수집 기간 1년→**5년**으로 변경.
  - `scripts/backtest/run_real.py` — **신규** 실데이터 백테스트 엔진. 가격 기반 신호(모멘텀/변동성조정/소외도/가격종합) Top10 월별 리밸런싱. 누적수익·CAGR·MDD·Sharpe·알파 산출 → backtest-result.json(realData:true).
  - `src/components/BacktestClient.tsx` — **신규** 결과 차트(전략 토글 + SVG equity curve + 메트릭 카드).
  - `src/app/backtest/page.tsx` — realData 있으면 차트, 없으면 "준비 중" 표시.
  - ⚠️ 정직성 원칙: 밸류·자금흐름은 과거 펀더멘털 없어 백테스트 제외(미래참조 편향 방지). 가격 복원 가능한 신호만.
  - 1년 데이터로 사전 테스트 완료(엔진 정상, tsc 통과). 5년 넣으면 의미 있는 결과.

---

## 🎯 외부 피드백 우선순위 진척
| 순위 | 작업 | 상태 |
|---|---|---|
| 1 | 데이터 정합성(날짜/가격 통일) | ✅ 완료 |
| 2 | 초보자 해석 레이어 | ✅ 완료 |
| 3 | 종목 탐색 필터 강화 | ✅ 완료 (push 대기) |
| 4 | 공시 신호 차별화 | ✅ 완료 |
| 5 | 백테스트 완성 | 🔧 엔진 완성 / 5년 데이터 수집 대기 |

---

## 🚧 다음 작업
1. **(즉시) 필터 + 백테스트 push** — `handoff/적용방법.md` 참고.
   - 필터: 파일 3개 덮어쓰고 push → 바로 배포.
   - 백테스트: `pip install finance-datareader pandas` → `python scripts/fetch_prices.py`(5년, 5~15분) → `python scripts/backtest/run_real.py` → push.
2. **공시 신호 추가 고도화** — 과거 유사 공시 후 주가 흐름, 같은 업종 유사 공시.
3. **검색 콘솔 등록** (구글/네이버) — 도메인 변경 후.
4. **브랜드 마이그레이션** — 도메인 확보 시 "밸류맵"→새이름 전체 변경(metadata/OG/JSON-LD/sitemap/로고/리디렉션).
5. 백테스트 고도화 — KOSPI 지수 벤치마크 추가(현재는 동일가중 근사), 거래비용 반영.

---

## 📁 핵심 파일 구조 (변경/신규 ⭐)
```
src/
├── app/
│   ├── stock/[ticker]/page.tsx   # 종목 상세 (가장 중요)
│   ├── stocks/page.tsx           # ⭐ 전체 탐색 (필터 강화 — 필드 전달 수정)
│   ├── backtest/page.tsx         # ⭐ 백테스트 (실결과 렌더로 교체)
│   ├── today/ compare/ disclosures/ watchlist/ about/ terms/ privacy/
│   ├── sitemap.ts robots.ts layout.tsx
│   └── api/cron/{notify,save-scores,daily-insight}/
├── components/
│   ├── StocksExplorer.tsx        # ⭐ 강화된 필터 + 질문형 프리셋
│   ├── BacktestClient.tsx        # ⭐ 신규 백테스트 차트 컴포넌트
│   ├── BeginnerReading.tsx SignalGuideExpand.tsx StockPriceChart.tsx
│   ├── ScoreHistoryChart.tsx AppHeader.tsx ... (총 31개)
├── lib/
│   ├── realStocks.ts             # ⭐ eps 매핑 추가
│   ├── signalGuide.ts priceHistory.ts scoreHistory.ts metrics.ts supabase/
public/data/
│   ├── stocks.json (138종목)  prices/{ticker}.json (→5년)
│   └── backtest-result.json (realData 플래그)
scripts/
├── fetch_prices.py               # ⭐ 1년→5년
├── backtest/run_real.py          # ⭐ 신규 실데이터 백테스트 엔진
├── backtest/{engine,metrics,run,sample_data}.py  # 기존(더미 데이터용)
├── fetch_stock_data.py sync_prices_to_stocks.py compute_metrics.py
```

---

## 🔑 환경변수 (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=  NEXT_PUBLIC_SUPABASE_ANON_KEY=  SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=  CRON_SECRET=  DART_API_KEY=  ANTHROPIC_API_KEY=
```

---

## 🚀 새 PC / 새 세션 시작 방법

### 방법 A) Cowork에 폴더 직접 연결 (권장)
1. Git/Node/Python 설치 → `git clone https://github.com/songchankeun-ship-it/valuemap-poc.git` → `npm install`
2. Claude 데스크톱 앱 Cowork 모드 → `valuemap-poc` 폴더 선택.
3. 첫 메시지: "CLAUDE.md 읽고 맥락 잡아줘. 이어서 작업하자!"

### 방법 B) 폴더를 zip으로 업로드 (이번 세션에서 쓴 방법)
- 작업 폴더(04_poc_app)를 zip으로 압축해 채팅에 업로드 → Claude가 압축 풀어 맥락 파악.
- node_modules 포함하면 용량 큼(200MB+) — 소스만 필요하면 node_modules/.next 빼고 압축해도 OK.

### 작업 사이클
TodoList → 코드 작성/tsc 검증 → 변경 파일 핸드오프(present_files) → 송님이 PowerShell에서 적용+push.
- 코드 변경, sync 스크립트 실행, git push는 송님이 PowerShell에서 (또는 폴더 연결 시 함께).
- 도메인 구매/결제/외부 가입은 송님 본인.

---

## 💡 작업 스타일 메모 (Claude → 다른 세션의 Claude에게)
- 친근한 반말 + "송님" 호칭, 이모지 적극(🎯✅⚠️🚀💡⭐).
- TaskCreate/TaskUpdate 적극 사용(진행 시각화 좋아함).
- AskUserQuestion으로 모호한 결정 분리.
- 코드 작성 시 tsc로 타입 검증 후 핸드오프.
- 외부 피드백 → 즉시 작업 전환 → push. 이게 작업 패턴.
- show_widget으로 배포 전 인터랙티브 미리보기 제공하면 송님이 좋아함.

---

## 📌 마지막 push 시점 (참고)
- 최신 commit (push된 것): `4b03d51` "docs: 다른 PC 인수인계 문서 추가"
- 이전: `6b0d6f4` 초보자 해석 레이어 + 공시 신호 가이드 / `c0ed07e` 기준일 통일 등
- 🆕 **미push 작업**: 2026-06-13 세션의 필터 강화 + 백테스트 엔진 (이 핸드오프 폴더 파일들). 적용 후 commit 예정:
  - `feat: 종목 탐색 필터 강화 (시총·ROE·배당·적자제외·시장 + 질문형 프리셋)`
  - `feat: 백테스트 실데이터(5년) + 결과 페이지`
- 다른 PC에서 `git log --oneline -5`로 확인 후 이어가기.

---

마지막 업데이트: 2026-06-13 (필터 강화 완료 + 백테스트 엔진 추가, 도메인 valuefit 검토 후 보류)
