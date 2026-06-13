# ValueMap (밸류맵) 프로젝트 인수인계 문서

> 이 파일은 Claude(나)가 송찬근 송님의 ValueMap 프로젝트 작업을 다른 PC/세션에서 매끄럽게 이어가기 위한 인수인계 문서입니다.
> 다른 PC에서 Claude(Cowork mode)를 시작하면, 이 파일을 첫 메시지로 보여주세요.

---

## 👤 사용자 정보
- **이름**: 송찬근 (Song)
- **이메일**: songchankeun@gmail.com
- **회사**: 필로소디
- **대화 언어**: 한국어 (친근한 반말, "송님" 호칭)
- **작업 스타일**: 적극적 푸시 선호, 빠른 행동, 친근한 톤. 작업 끝에 격려/이모지 OK.

---

## 🌐 프로젝트 개요

- **현재 사이트명**: 밸류맵 (ValueMap)
- **배포 URL**: https://valuemap.kr (운영 중)
- **GitHub**: https://github.com/songchankeun-ship-it/valuemap-poc
- **로컬 작업 폴더**: `C:\Users\csgk0\Desktop\새 폴더\04_poc_app`
- **브랜치**: `main` (push 시 Vercel 자동 배포)

### ⚠️ 진행 중: 브랜드 마이그레이션
- "밸류맵"이 부동산 앱과 충돌 (50만+ DAU) → 이름 변경 결정
- **결정된 새 이름: KSift (케이씨프트)**
- 도메인 확인 중: `ksift.com`, `ksift.kr` (가비아에서 확인 중)
- 도메인 확보되면 사이트 전체 마이그레이션 작업 예정

---

## 🛠️ 기술 스택

- **Framework**: Next.js 14 App Router (server components)
- **Styling**: Tailwind CSS v4 (다크모드 `darkMode: "class"`)
- **DB**: Supabase PostgreSQL + Row Level Security
- **Auth**: Magic link + Kakao OAuth (Supabase)
- **Email**: Resend REST API (fetch 사용, SDK 아님)
- **Deploy**: Vercel (자동 배포)
- **Cron**: vercel.json 설정 (3개 cron 운영)
- **Data**:
  - `public/data/stocks.json` — 138개 종목 메타데이터
  - `public/data/prices/{ticker}.json` — 종목별 1년 가격 시계열
  - Supabase `daily_scores` 테이블 — 일별 점수 히스토리

### 핵심 라이브러리
- `next-themes` (다크모드)
- `lucide-react` (아이콘)
- `@vercel/analytics`, `@vercel/speed-insights`
- Python scripts: `FinanceDataReader`, `yfinance`, `pandas`

---

## 📊 4대 지표 + 공시 신호 (서비스 핵심)

### 자체 지표 4종
1. **모멘텀 (Momentum)**: 1·3·6개월 가중평균 수익률
2. **자금흐름 (Flow)**: 5일 평균 거래량 ÷ 20일 평균
3. **밸류 (Value)**: PER·PBR 풀 내 분위
4. **변동성조정 (Vol)**: Sharpe Ratio 기반

### DART 공시 5종 신호
1. 자기주식 취득 (treasury_buy)
2. 임원·주요주주 매수 (insider_buy)
3. 정정공시 (correction)
4. 단일판매·공급 계약 (single_contract)
5. 유상증자·CB 발행 (capital_raise)

---

## ✅ 완료된 주요 작업 (시간순)

### SEO 패키지
- `src/app/sitemap.ts` — 148개 URL 동적 sitemap
- `src/app/robots.ts` — 크롤링 규칙
- 종목 페이지 JSON-LD (Article + BreadcrumbList)
- 사이트 전체 JSON-LD (Organization + WebSite)

### 주가 차트
- `scripts/fetch_prices.py` — 138개 종목 1년 가격 수집 (FinanceDataReader)
- `scripts/sync_prices_to_stocks.py` — stocks.json과 가격 데이터 동기화
- `src/lib/priceHistory.ts` — 서버 컴포넌트용 데이터 로더
- `src/components/StockPriceChart.tsx` — SVG 차트 (1주/1개월/3개월/6개월/1년 토글, 호버, 다크모드)

### 신뢰 디테일 (외부 피드백 반영)
- 데이터 기준일 통일 (`asOfBusinessDate` 우선, generatedAt fallback)
- 모바일 헤더 "06.12(금) 장마감" 형태로 정리
- 종목 페이지에서 차트 데이터를 진실의 원천으로 (헤더 가격 = 차트 마지막 가격)
- 모바일 터치 영역 44px+ (관심 종목/비교/공유 버튼)
- today 카드 한 줄 이유 ("💡 모멘텀 92 + 자금흐름 88 강세")
- 홈 Top 3 미리보기 + 최근 공시 신호 2개

### 첫 사용자 온보딩
- `src/components/ScoreTooltip.tsx` — 점수 옆 (?) 아이콘
- `src/components/WelcomeOnboarding.tsx` — 모바일 컴팩트 (한 줄 + 펼치기), 데스크톱 풀 카드
- 종목 페이지 + today 헤더에 (?) 아이콘

### 초보자 해석 레이어 ⭐
- `src/components/BeginnerReading.tsx`
  - 종목 점수 패턴 자동 판정 (추세형/저평가형/관심집중형 등 8가지)
  - "확인할 3가지" 자동 생성
  - 4지표 한 줄 한국어 해석 ("모멘텀 100 → 따라 사기 전 급등 이유 확인")
- 종목 페이지 상단에 통합

### 공시 신호 차별화 ⭐ (USP)
- `src/lib/signalGuide.ts` — 5종 신호 해석 데이터 (왜 중요한지 + 확인할 3가지 + 과거 패턴 + 주의점)
- `src/components/SignalGuideExpand.tsx` — "이 공시 이해하기 ▼" 펼침
- 공시 페이지에 통합

### 알림 시스템
- `src/app/api/cron/notify` — 매일 KST 16:30 (UTC 07:30) 발사
- 관심 종목 ∩ 공시 신호 매칭
- Resend API로 이메일 발송

### 점수 변화 차트
- `src/components/ScoreHistoryChart.tsx` — composite + 4지표 SVG sparkline
- `src/lib/scoreHistory.ts` — Supabase 조회
- `src/app/api/cron/save-scores` — 매일 KST 17:00 자동 저장

### 다크모드
- `next-themes` ThemeProvider
- 모든 컴포넌트 `dark:` 변형
- ThemeToggle 헤더 통합

### 정적 페이지 (P1 작업)
- `src/app/about/page.tsx` — 서비스 소개 + 운영자 정보 + 산식 공개 + 한계
- `src/app/terms/page.tsx` — 이용약관 8조
- `src/app/privacy/page.tsx` — 개인정보처리방침 8조

---

## 🎯 외부 피드백 우선순위 진척

피드백 출처: 외부 컨설팅/AI 평가 (송님이 받아옴)

| 순위 | 작업 | 상태 |
|---|---|---|
| 1 | 데이터 정합성 (날짜/가격 통일) | ✅ 완료 |
| 2 | 초보자 해석 레이어 | ✅ 완료 |
| 3 | 종목 탐색 필터 강화 (시총·ROE·업종·배당) | ⏳ 대기 |
| 4 | 공시 신호 차별화 | ✅ 완료 |
| 5 | 백테스트 완성 | ⏳ 대기 |

---

## 🚧 진행 중 / 다음 작업

### 즉시 다음 (도메인 결정 후)
1. **브랜드 마이그레이션** (ValueMap → KSift)
   - 모든 페이지 "밸류맵" → "KSift" 변경
   - metadata, OG, JSON-LD 도메인 변경
   - sitemap.xml 도메인 변경
   - 로고 (V → K)
   - valuemap.kr → ksift.com 리디렉션 (Vercel 설정)
   - 검색 콘솔 새 도메인 등록

### 중장기
2. **종목 탐색 필터 강화** (외부 피드백 3순위)
   - 시가총액 구간, ROE 최소값, 업종, 배당수익률
   - 적자 기업 제외, 관리종목 제외
   - "저평가 + 거래량 증가" 같은 질문형 프리셋
3. **백테스트 완성** (5순위)
   - 5년 데이터로 4가지 전략 검증
   - 누적 수익률, MDD, Sharpe, KOSPI 대비 알파
4. **공시 신호 추가 고도화**
   - 과거 유사 공시 후 주가 흐름 (백테스트 결과)
   - 같은 업종 내 유사 공시 찾기

### 잠재 작업
- 검색 콘솔 등록 (구글/네이버) — 도메인 변경 후
- 첫 사용자 모집 (커뮤니티 글, SNS 공유)
- 유료 플랜 설계 (시간 절약 도구 컨셉)

---

## 📁 핵심 파일 구조

```
src/
├── app/
│   ├── page.tsx                 # 홈 (히어로 + Top 3 + 공시 2개)
│   ├── today/page.tsx           # 오늘의 후보 종목
│   ├── stocks/page.tsx          # 전체 138개 탐색
│   ├── stock/[ticker]/page.tsx  # 종목 상세 (가장 중요)
│   ├── compare/                 # 종목 비교
│   ├── disclosures/             # 공시 신호 탐색
│   ├── watchlist/               # 관심 종목 (로그인)
│   ├── settings/notifications/  # 알림 설정
│   ├── about/, terms/, privacy/ # 정적
│   ├── sitemap.ts               # SEO
│   ├── robots.ts                # SEO
│   ├── layout.tsx               # 루트 + Organization JSON-LD
│   └── api/
│       ├── cron/notify/         # 매일 알림 발사
│       ├── cron/save-scores/    # 매일 점수 저장
│       └── cron/daily-insight/  # AI 인사이트
├── components/
│   ├── AppHeader.tsx            # 글로벌 헤더 (데이터 기준일 표시)
│   ├── BeginnerReading.tsx      # ⭐ 초보자 해석 카드
│   ├── ScoreTooltip.tsx         # 점수 옆 (?) 아이콘
│   ├── StockPriceChart.tsx      # SVG 가격 차트
│   ├── ScoreHistoryChart.tsx    # 점수 변화 sparkline
│   ├── SignalGuideExpand.tsx    # ⭐ 공시 가이드 펼침
│   ├── WelcomeOnboarding.tsx    # 첫 방문 환영
│   ├── DisclosureExplorer.tsx   # 공시 탐색
│   ├── CompareClient.tsx        # 종목 비교
│   ├── AddToWatchlistButton.tsx # ❤️ 관심 종목
│   ├── AddToCompareButton.tsx   # 비교 추가
│   ├── ShareButton.tsx          # 공유
│   └── ...
├── lib/
│   ├── realStocks.ts            # stocks.json 로더 + asOfBusinessDate fallback
│   ├── priceHistory.ts          # 가격 데이터 (fs.readFile)
│   ├── scoreHistory.ts          # Supabase 조회
│   ├── signalGuide.ts           # ⭐ 공시 5종 해석 데이터
│   └── supabase/                # Supabase 클라이언트
public/
└── data/
    ├── stocks.json              # 138개 종목 + asOfBusinessDate
    └── prices/{ticker}.json     # 1년 가격 시계열 (138개)
scripts/
├── fetch_stock_data.py          # FDR + Naver + yfinance 종목 데이터
├── fetch_prices.py              # 가격 시계열 수집
├── sync_prices_to_stocks.py     # ⭐ stocks.json과 prices 동기화
└── compute_metrics.py           # 4지표 계산
```

---

## 🔑 환경변수 (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CRON_SECRET=
DART_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 🚀 새 PC 설정 가이드

### 1. 필수 소프트웨어
```powershell
# Git
winget install Git.Git

# Node.js LTS
winget install OpenJS.NodeJS.LTS

# Python
winget install Python.Python.3.12

# Claude 데스크톱 앱 (같은 계정 로그인)
# https://claude.ai 에서 다운로드 또는 https://www.anthropic.com/claude
```

### 2. 프로젝트 클론
```powershell
cd ~\Desktop
mkdir 작업폴더
cd 작업폴더
git clone https://github.com/songchankeun-ship-it/valuemap-poc.git
cd valuemap-poc

# 의존성 설치
npm install
pip install finance-datareader yfinance pandas requests
```

### 3. Cowork에서 폴더 선택
- Claude 데스크톱 앱 실행
- Cowork 모드
- `valuemap-poc` 폴더 선택

### 4. 새 Claude 세션 첫 메시지 템플릿
```
이 프로젝트를 다른 PC에서 이어가려고 해.
먼저 `CLAUDE.md` 파일 읽고 맥락 잡아줘.

지금 진행 중인 작업: KSift 도메인 결정 대기 중.
가비아에서 ksift.com / ksift.kr 확인했어 (결과: 여기에 입력).

이어서 작업하자!
```

---

## 💡 작업 스타일 메모 (Claude → 다른 세션의 Claude에게)

송님과 작업할 때:
- **친근한 반말 + "송님" 호칭** (예: "송님 진짜 잘했어!", "이제 가자")
- **이모지 적극 사용** (🎯, ✅, ⚠️, 🚀, 💡, ⭐)
- **TaskCreate/TaskUpdate 적극 사용** — 진행 상황 시각화 좋아함
- **AskUserQuestion** 모호한 결정 시 사용
- **TodoList → 작업 → push 한 사이클**로 끝내기
- **PowerShell 명령어는 복붙 가능하게 정확히** 적어주기
- **`mcp__cowork__present_files`** 로 결과물 공유

송님이 자주 받는 외부 피드백 → 즉시 작업으로 전환 → push.
이게 작업 패턴.

송님이 직접 결정해야 할 일은 명확히 분리해서 알려주기:
- 도메인 구매, 결제, 외부 서비스 가입은 송님 본인이 해야 함
- 코드 변경, sync 스크립트 실행, git push는 함께 또는 송님이 PowerShell에서 실행

---

## 📌 마지막 push 시점 (참고)

- 최신 commit: `6b0d6f4` "feat: 초보자 해석 레이어 + 공시 신호 가이드 + 표시 일관성"
- 이전: `c0ed07e` "fix: 기준일 통일/모바일 컴팩트 환영/터치 타겟/갱신 표현 정리"
- 이전: `57d3b63` "data: sync prices to stocks.json (가격 일치)"

다른 PC에서 `git log --oneline -5` 로 확인 후 이어가기.

---

마지막 업데이트: 2026-06-13 (KSift 도메인 결정 대기 시점)
