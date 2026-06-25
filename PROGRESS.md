# 오른스코어 안정화·고도화 PROGRESS

## 2026-06-25 · 1차 상용화 안정화 P2 — 데이터 소스 상용 리스크표·약관/개인정보/AI 고지 보강·관리자 QA 정리 (Task 37, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P2(상용화 검토). 신규 기능이 아니라 **상용 이용 리스크 문서화·법무성 고지 보강·관리자 데이터 상태/오류 신고 가능 범위 점검·QA 최종 스윕**. branch `ai-center/task-37-ornscore-1-p2-ai-qa`. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 데이터 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 기준 `533c6d2`가 아니라 `67defec`(= Task 33~36이 위에 쌓인 상태). 작업트리 클린 확인 후 **리셋하지 않고 그대로 이어서** 작업.
- **설계서 메모**: 외부 PDF PART L/M/N/O/P 원문은 레포에 없음 → 지어내지 않고 **작업지시 + `docs/ornscore-improvement-brief.md`** 기준으로만 작성. 법적 결론은 확정하지 않고 "검토 필요"로 표기.

### 완료한 작업 (작업범위 2~6)
- **(2) 데이터 소스 상용 이용 리스크 표** 신규 `docs/data-source-commercial-risk.md`: KRX·DART·Naver Finance·yfinance·FinanceDataReader 5소스를 **소스 / 현재 사용 위치(코드 경로) / 상용 리스크 / 공식 인터페이스 유무 / 대체·fallback 필요 / 조치 상태** 6열 표로 정리. 법적 결론 확정 금지 — 전 항목 "검토 필요"·"공식 인터페이스 확인"·"대체 검토"·"fallback 필요"로 실행 가능하게 표기. Naver(공식 API 부재 추정, 대체 우선순위 높음)·yfinance(비공식, fallback) 강조. "상용화 전 법무 검토 필요" 리드.
- **(3) 약관/개인정보/AI 고지 보강 항목** 신규 `docs/legal-ai-commercial-readiness.md`: (A) 약관 9항목(결제일·자동갱신·해지·환불·청약철회·결제 실패·요금제 변경·장애 보상·유료 기능 변경 가능성)을 **현재 상태 / 보강 문구 방향(초안) / 상용화 전 확정** 표로(결제 미라이브 명시). (B) 개인정보 국외 이전 **역할별 표**(인증/저장=Supabase 일본·호스팅=Vercel 미국·메일=Resend 미국·AI=Anthropic 미국·소셜=Kakao 국내). (C) AI 분석 고지 실행 전+결과 하단 문구안. 각 절 "초안 · 상용화 전 검토 필요" 리드.
- **(4) 화면 반영(비확정 초안)** 코드 4파일, 표시·고지 문구만:
  - `src/components/AiAnalysisCard.tsx`: **실행 전 고지 1줄** 버튼 위 추가("AI 분석은 입력 데이터를 Anthropic(미국)에 전달해 생성하는 참고 정보이며, 매수·매도 추천이 아닙니다."). 결과 하단 기존 고지 유지.
  - `src/app/privacy/page.tsx`: §5 위탁·§5-1 국외 이전 항목을 **역할 라벨**(인증·저장/호스팅/메일 발송/AI 처리/소셜 로그인 제공자)로 명시. §5-1에 역할별 이전 표(국가·항목·목적) 추가. 내용 보존, 거짓 확정 없음.
  - `src/app/terms/page.tsx`: **"유료 서비스 이용 (출시 예정 · 초안)"** 섹션 추가 — `/pricing` 링크, 결제주기/환불/청약철회/장애 보상은 상용화 전 확정 고지(amber 박스로 초안 명시, 구속력 있는 수치 없음).
  - 금칙어 목록 대조: 추가 문구는 부정문 고지("매수·매도 추천이 아닙니다")만 사용.
- **(5) 관리자 데이터 상태/오류 신고 점검** `src/app/status/page.tsx`: 기존 `domainStatuses`(가격/재무/공시/산식) 품질 항목은 이미 노출 중 → **"데이터 오류 신고" 섹션 추가**(종목·항목·기대값·화면 URL·데이터 기준일/산식 버전을 prefill한 mailto 링크, 44px 버튼). 전체 관리자 대시보드/오류 신고 관리 시스템은 **후속 과제로 명시**(가능 범위 vs 후속 과제 분리, 문서 링크).
- **(6) QA 최종 스윕**: 검증 라우트 전수 200·SSR 마커·금칙어 0 확인(아래). 남은 리스크 문서화.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/status`·`/terms`·`/privacy` 프리렌더, exit 0
- 변경 4파일 + 신규 2문서 금지표현 grep = 0(terms 기존 §2 "수익 보장"은 "제공하지 않습니다" 부정문 고지로 보존, 이번 변경 아님).
- 로컬 prod(127.0.0.1:**3253**, 내 리스너 PID 7420만 taskkill·운영자 4310 무중단): 검증 라우트 `/ /status /pricing /guide/metrics /disclosures /backtest /terms /privacy` 전부 HTTP 200·에러 마커 0. SSR: `/status` "데이터 오류 신고하기", `/terms` "유료 서비스 이용 (출시 예정 · 초안)", `/privacy` "AI 처리 제공자" 렌더 확인.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → 자동 DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. 시작 시 포트 3000 미기동 상태(운영자 미실행) — 변경 안 함. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 체크 권장** — `/status` 오류 신고 버튼 44px·`/terms` 초안 박스·`/privacy` 역할 표 가로 오버플로우 0·콘솔 0.

### 결정 / 잔여 리스크 / 다음
- **설계서 PART L/M/N/O/P 원문 미확보** — 작업지시+brief 기준 문서화. 추출본 레포 반영 시 재대조.
- **결제 약관 미확정** — 결제(PG) 미라이브. 약관 9항목은 출시 전 법무 확정 필요(`docs/legal-ai-commercial-readiness.md` A항).
- **데이터 소스 법무 검토 미완** — `docs/data-source-commercial-risk.md`는 코드 사용 현황 기반 추정. 출처별 약관 원문 대조·Naver 대체·KRX 상용 라이선스는 미해결.
- **관리자 시스템** — 전체 데이터 상태판/오류 신고 관리 대시보드는 후속 과제(현재 메일 접수로 가능 범위 처리).
- 다음: 운영자 모바일 게이트, 결제 도입 시 약관 확정, 데이터 소스 약관 원문 검토, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P1-B — 비교 시작 화면·상단/모바일 메뉴 단순화·종목 탐색 검색 우선·요금제 경계 (Task 36, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P1-B. 신규 기능이 아니라 **비교 빈 화면의 "시작 가능성"·메뉴 과밀 해소·탐색 첫 화면 단순화·무료/Pro 경계 명확화**. branch `ai-center/task-36-ornscore-1-p1-b`. 점수 계산식·`stocks.json`·`backtest-result.json`·`direction` 데이터 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 기준 `533c6d2`가 아니라 `b3070dd`(= Task 33~35가 위에 쌓인 상태) — P1-B는 그 위에 쌓으므로 **리셋하지 않고 그대로 이어서** 작업(작업트리 클린 확인).
- **설계서 메모**: 외부 PDF PART F/G/H/K 원문은 레포에 없음 → 지어내지 않고 **작업지시 2~5 + `docs/ornscore-improvement-brief.md`** 기준으로만 구현.

### 완료한 작업 (작업지시 2~5)
- **(2) 비교 시작 화면** `compare/page.tsx`+`CompareClient.tsx`:
  - 서버: `sectorOf(themes)`로 그룹핑해 **추천 비교 세트** 계산 — 검증 보류 제외·`compositeOf>0`인 종목을 업종별로 묶어 ≥2종목 업종만, 종합점수 상위 2~4종목, 피어 많은 업종 우선 상위 3세트(`recommendedSets` prop). 표본 부족 업종은 세트 생성 안 함(가짜 세트 금지). 기존 `top5`/`stockMap` 보존.
  - 클라: 게이트를 `stocks.length === 0`→**`< 2`**로 변경(1개 선택도 시작 화면 유지). 1개 선택 시 **제거 가능한 선택 칩 + "비교하려면 1개 더 선택하세요 (최소 2개 · 최대 4개)" 안내**. 추가 경로 5종 — **추천 비교 세트**(클릭 시 세트 전체를 순차 `addToCompare`로 담아 4개 상한 준수)·**오늘 Top 5**(이미 담긴 종목 ✓ 비활성)·**관심 종목에서 추가**(`getWatchlist()` 마운트 로드, `stockMap`으로 이름 매핑, 관심 종목 없으면 블록 생략)·**직접 검색**(StockSearchBox)·**같은 업종 탐색**(/stocks). 전 터치 타깃 ≥44/36px.
  - **최근 본 종목**은 저장소가 없어 가짜로 만들지 않고 후속 과제로 남김.
- **(3) 상단/모바일 메뉴 단순화** `Sidebar.tsx`+`MobileNav.tsx`+`MobileBottomNav.tsx`:
  - 데스크톱 1차 메뉴(ungrouped) = **오늘 · 종목 찾기 · 공시 신호 · 백테스트 · 요금제**, 나머지(관심 종목·비교·분석 기록·지표 가이드·서비스 소개)는 **"더보기"** 그룹으로 이동. 라우트/href·active 로직·`showGroup` 디바이더 무변경(재배열만).
  - 모바일 하단 네비 = **4셀 유지**(오늘·종목 찾기·공시 신호 + 더보기 버튼). 관심을 PRIMARY→MORE 시트로 이동. MORE 시트에 모든 라우트(관심·비교·백테스트·분석 기록·요금제·지표 가이드·서비스 소개) 도달 가능. 헤더 드로어 `MobileNav` ITEMS도 동일 1차/더보기 분리로 일치. `aria-label`·Esc/오버레이 닫기·포커스 보존.
- **(4) 종목 탐색 검색 우선** `StocksExplorer.tsx`(표시/레이아웃만): 첫 화면 순서를 **검색창(헤더 바로 아래, 돋보기 아이콘·큰 입력) → 질문형 프리셋 → (빠른 프리셋 `<details>` 기본 접힘) → 상세 필터(데스크톱 `showAdvanced` 기본 false·모바일 하단 드로어)**로 재배치. 기존 정렬/필터 행의 중복 검색 input 제거(검색은 상단 1곳으로). 활성 필터 칩 바·per-chip 제거·초기화는 그대로 도달 가능. `PRESETS`/`QUESTION_PRESETS`·`matchesConfig`·정렬·저장검색/알림·localStorage 뷰모드 핸들러 무변경.
- **(5) 요금제 경계 명확화** `pricing/page.tsx`: 무료 카드에 **"탐색·기본 지표·오늘 후보까지 무료로 충분 · 결제 없이 핵심 가치 경험"** 한 줄 추가. Pro 카드에 **"왜 Pro인가 — 시간 절약·변화 알림·기록 관리"** 한 줄 추가(수익률 향상/매수·매도 조언 비제공 캐비엇 포함). 한도 숫자는 `limits.ts` 단일 출처 유지. **Premium 티어는 정의되지 않아 2티어(무료/Pro) 유지** — 가짜 가격/기능 토글 만들지 않음. 기존 `WaitlistForm`·비자문 고지 블록 보존.
- **(작업지시 5/제한 화면)** `AddToCompareButton.tsx`: 4개 초과 토스트를 **"비교는 최대 4개까지 가능해요 — 하나를 빼고 추가하세요"**로 친절·비차단 문구화(`COMPARE_MAX` 정렬, 동작 무변경).

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/stocks` 14.1 kB, exit 0
- 변경 파일 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입 시점/따라 사기/AI 픽/매수 후보/수익 보장 등) grep = 0.
- 로컬 prod(127.0.0.1:**3251**, 내 리스너 PID 15804만 taskkill·운영자 3000/4310 무중단): 검증 5라우트 `/ /today /stocks /compare /pricing` 전부 HTTP 200. SSR: 사이드바/네비 1차 순서(오늘·종목 찾기·공시 신호·백테스트·요금제)+"더보기"·"관심 종목", `/stocks` "종목명 · 코드로 바로 검색"(검색 우선)+질문형 프리셋+빠른 프리셋(접힘), `/pricing` "탐색 · 기본 지표 · 오늘 후보"·"무료로 충분히"·"왜 Pro인가", `/compare` 플라이트 페이로드에 `recommendedSets`(반도체·IT부품 등 실데이터 4종목) 전달 확인.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **`/compare` 시작 화면 본문은 클라이언트 렌더(`mounted` 게이트)라 SSR HTML에 안 보임 — 데이터는 flight 페이로드로 확인**. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 비교 시작 화면(추천 세트/선택 칩/최소 2개 안내)·상단 메뉴 5개+더보기·모바일 하단 4셀+더보기 시트·`/stocks` 검색 우선·요금제 무료/Pro 경계, 가로 오버플로우 0·터치 44px·콘솔 0.

### 결정 / 잔여 리스크 / 다음
- **최근 본 종목** 저장소 부재 → 비교 추가 경로에서 제외(후속 과제, 가짜 동작 금지).
- **Premium 티어** 미정의 → 2티어 유지(무료/Pro). 정의되면 "출시 예정/검토 중" 컬럼으로 추가 가능.
- 외부 PDF PART F/G/H/K 원문 미확보 — 추출본 레포 반영 시 잔여 재대조. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P1-A — 공시 확인포인트 문구·카드 주의 라인·기간 고지·백테스트 오해 방지 (Task 35, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P1-A. 신규 기능이 아니라 **공시 신호 문구 리스크 제거·카드 구조 통일·수집 범위 고지·백테스트 오해 방지**. branch `ai-center/task-35-ornscore-1-p1-a`. 점수 계산식·데이터 생성·`backtest-result.json`·`direction` 데이터값 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **시작 상태 메모**: HEAD는 기준커밋 `533c6d2`가 아니라 `8966e63`(= Task 33 P0-A·Task 34 P0-B 4커밋이 533c6d2 위). P1-A는 그 위에 쌓으므로 **리셋하지 않고 그대로 이어서** 작업(작업트리 클린 확인).
- **설계서 메모**: PART D/E 원문(외부 PDF)은 레포에 없음 → 지어내지 않고 **작업지시 2~6 + `docs/ornscore-improvement-brief.md`(Disclosure Signals·Terminology 절)** 기준으로만 구현.

### 완료한 작업 (작업지시 2~6)
- **(2) 공시 문구 확인포인트화** `DisclosureExplorer.tsx`(`SIGNAL_DESCRIPTIONS`)·`disclosure-signals.ts`(treasury note): 자사주→"주주환원·주가 안정 관련 이벤트. 취득 규모·소각 여부 확인 필요." / 보유변동→"주요 주주·임원 지분 변화. 매수·매도 방향 원문 확인 필요." / 대형계약→"계약 규모의 매출 영향 확인 필요." / 유증·CB(3종)→"희석·자금조달 구조(용도·규모·가격) 확인 필요." / 정정→"기존 공시 내용 변경 확인 필요." **detector note의 "통상 단기·중기 호재 신호" → "자기주식 취득 결의 — 취득 규모·소각 여부는 원문 확인 필요"**(호재 단정 제거, /disclosures·/stock 양쪽 카드에 노출되는 소스).
- **(3) 방향 배지 valence 제거** `DisclosureExplorer.tsx`+`StockDisclosures.tsx`: "방향 긍정 가능(red)/부정 가능(blue)" → 사실 라벨 **"장내매수 단서"/"장내매도·처분 단서"/"방향 확인 필요"** + 중립 slate 배지(긍정/부정 valence·등락색 제거, §20.7 텍스트 동반). `direction` 데이터값 무변경, 표시만.
- **(4) 카드 구조 통일 + 주의 라인** `DisclosureExplorer.tsx`: 타입 배지→종목명→제출일→한 줄 요약→**확인할 것**(zinc)→**주의**(amber, 신규)→액션행(원문/종목/이 공시 이해하기). 주의 라인은 `signalGuide.cautionNote` 첫 문장(트림) 또는 타입별 폴백. 44px 터치·`flex-wrap`/`break-words`/`min-w-0` 보존.
- **(5) 수집 범위 고지 상시화·일치** `DisclosureExplorer.tsx`+`disclosures/page.tsx`: `totalDisclosures>=200` 조건부였던 "최신 200건" 배지·안내문을 **무조건 노출**로 변경 — "선택한 N일 전체 공시가 아니라, 코스피·코스닥 각 최신 100건(합 200건)에서 자동 추출한 신호입니다. 표시는 최대 50건." 페이지 `<details>` 요약도 같은 단일 문구로 미러링(헤더↔리스트 일치). `dataStatus` 미사용 import 제거.
- **(6) 홈↔공시 숫자 모순 제거** `recentSignals.ts`+`api/disclosures/recent/route.ts`: `signalCount`를 전체 탐지수가 아니라 **표시 가능한 신호수(slice 50)** 와 일치시킴 → 홈 KPI와 /disclosures가 같은 수를 보이고 항상 ≥ 이벤트 묶음. **샘플 폴백 데이터도 교정**: `public/disclosure-samples/recent-signals.json`(signalCount 12→9·호재 note 2건)·`005930.json`·`373220.json`(호재 note 1건) — DART 키 부재 시 폴백되는 정적 샘플에 잔존하던 구 호재 문구·과대 카운트 제거. `MarketSnapshotCards` 공시 카드 보조문구 "DART 자동 분류"→"DART · 최신 200건 내"(홈·today 공통).
- **(작업지시 6/백테스트) 오해 방지** `BacktestClient.tsx`+`backtest/page.tsx`+`BacktestRiskNotice.tsx`: h1 "백테스트"→**"실험 전략 백테스트"**, `BacktestRiskNotice`에 단일 소스 리드 고지 **"…현재 ORNSCORE 종합점수 검증 결과는 아닙니다."**(`dataStatus.limits.backtest` 재사용). 마지막 리밸런싱 보유 블록에 **"과거 시뮬레이션의 마지막 리밸런싱 구성 · 현재 확인 후보나 추천이 아닙니다."** 캡션. 세 날짜 분리 표기 — **데이터 기간(period) / 백테스트 생성일(generatedAt) / 사이트 현재 데이터 기준(dataStatus.globalAsOfLabel, 서버 prop `siteDataAsOf`)**. 준비중 fallback h1도 통일. 데이터·metrics 무변경.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/disclosures` 11.3 kB, exit 0
- 변경 added 라인 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입/따라 사기/AI 픽/매수 후보/호재 확정/악재 확정) grep = 0. 잔존 "호재"는 전부 **부정 캐비엇**("호재/악재 점수가 아니라/아닌" — brief 권장 표현 "호재/악재 점수가 아님")만.
- 로컬 prod(127.0.0.1:**3252**, 내 리스너 PID만 taskkill·운영자 4310 무중단): 검증 5라우트 `/disclosures /backtest / /today /stock/005380` 전부 HTTP 200·에러 마커 0. SSR: 공시 카드 타입배지/종목명/제출일/한줄요약/확인할 것/주의/이 공시 이해하기 전수 렌더, "최신 200건 내"·"전체 공시가 아니라"·"표시는 최대 50건" 상시 노출, **긍정/부정 valence 배지 0**(장내매수 단서·방향 중립), 백테스트 "실험 전략 백테스트"+"종합점수 검증 결과는 아닙니다"+3날짜 분리+리밸런싱 caveat, 홈 "공시 신호 9건"=/disclosures "신호 9건·이벤트 9개"(모순 해소), /stock/005930·373220 호재 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 공시 카드 주의 라인·액션행 44px·가로 오버플로우 0, 백테스트 KPI 수익/위험 2박스·3날짜 푸터·기간 고지 줄바꿈, 콘솔 오류 0.

### 결정 / 잔여 리스크 / 다음
- `direction` 데이터값(긍정 가능/부정 가능/확인 필요)은 무변경 — 표시 라벨만 사실(장내매수/매도 단서) 또는 "방향 확인 필요"로 중립화. 추후 enrichment가 실제 방향을 확정하면 그대로 사실 라벨로 승격 가능.
- `signalGuide.ts` `pastPattern`은 여전히 방향성 % 범위("+2~5%" 등)를 "(절대값 X)" 캡션과 함께 보유 — 카드 본문이 아니라 '이 공시 이해하기' 펼침 안에만 노출. 추가 완화는 후속 검토.
- 공시 신호 표시 상한 50건·수집 200건은 성능·비용 제약(상시 고지로 정직 표시). 시점별 전체 수집은 후속 과제.
- 외부 PDF PART D/E 원문 미확보 — 추출본 레포 반영 시 잔여 재대조. 다음: 운영자 모바일 게이트, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P0-B/P1 — 종목 상세 번호 중복·CTA 버튼 그룹·데이터 배지·점수/순위 분리·밸류 기준 (Task 34, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 P0-B/P1. 신규 기능이 아니라 **종목 상세 UI 기본기·표현 명확성**(번호 중복, 버튼 붙음, 배지 붙음, 점수≠순위, 밸류 업종 편향) 정리. branch `ai-center/task-34-ornscore-1-p0-b-ui`. 점수 계산식·데이터 생성 **무변경**, 신규 npm 0·빌드 단계 추가 0.
- **설계서 위치 메모**: 기준 PDF(`ORNSCORE 사이트 진단 및 개선 설계서.pdf`)·`ornscore_design_improvement_spec.md`는 저장소에 없음(레포 외부). PART C/I/J 원문 미확보 → 내용을 지어내지 않고 **작업지시 2~7 + `docs/ornscore-improvement-brief.md`(PDF 변환본)** 기준으로만 구현.
- **시작 상태 메모**: HEAD는 기준커밋 `533c6d2`가 아니라 `b3b4f6f`(= Task 33 P0-A 2커밋이 533c6d2 위에 올라간 상태). P0-B는 P0-A 위에 쌓는 것이므로 **리셋하지 않고 그대로 이어서** 작업(작업트리 클린 확인).

### 완료한 작업 (작업지시 2~7)
- **(2) 번호 중복 제거** `src/components/BeginnerReading.tsx`: 초보자 카드 하단의 중복 앵커 칩(📋 관련 공시 확인/💰 재무 보기/📊 점수 근거)을 제거 — 이 칩들은 위의 번호형 "먼저 확인할 것" ol(점수→공시→재무)·상단 히어로 "다음으로 확인할 것" 버튼과 같은 앵커를 3중 반복했음. 번호형 STEP 순서 목록 **1개만** 캐논으로 남기고, 칩 자리에는 "위 먼저 확인할 것 순서 또는 상단 버튼 이용" 안내 1줄로 대체. 종목 상세 `<ol>` = 1개(검증).
- **(3) CTA 버튼 그룹** `src/components/stock/StockHeader.tsx`: actionsSlot(관심/비교/공유) 컨테이너를 공통 버튼 그룹 스타일로 — 데스크톱은 우측 가로 배치+명확한 간격(`gap-2`), 모바일은 `w-full`로 한 줄 내려 `[&>*]:flex-1`로 균등 폭 줄바꿈(텍스트처럼 붙지 않게). 버튼 컴포넌트 로직·라벨 무변경(컨테이너/간격만). 기존 44px 터치 유지.
- **(4) 데이터 상태 배지 분리** `src/components/stock/PriorityScoreCard.tsx`: 붙어 있던 3개 평문 span → **독립 pill 배지** `[필수 데이터 100%]`(중립) `[이상값 점검 통과]`(emerald) 또는 `[이상값 점검 중·임시 점수]`(amber) `[Metrics 2.4]`(중립). `rounded-full`+테두리+`gap-1.5 flex-wrap`으로 모바일에서도 안 붙음. 정적 Tailwind 리터럴만(런타임 합성 0).
- **(5) 점수≠순위 분리** `MetricInsightCards.tsx`+`PriorityScoreCard.tsx`: 지표 카드에서 값을 **"점수 {v} / 100"**로 명시, 순위는 별도 줄 **"전체 상대순위 {rank} / {total}위 · 상위 X%"**로 분리(같은 숫자처럼 안 보이게), 해석 줄에 **"해석:"** 라벨 추가. PriorityScoreCard 순위 블록에 "상대순위(점수와 별개)" 캡션. 계산(topPctOf/rankOf/compositeOf) 무변경·표시 전용.
- **(6) 밸류 기준 명확화** `MetricInsightCards.tsx`+`src/app/stock/[ticker]/page.tsx`: 4지표 밸류 카드에 **"전체 풀 기준 점수 · 업종 내 상대 위치는 아래 업종 대비 밸류 참고"** 라벨. 종목 상세 cyan 박스는 "(위 밸류 점수와 기준 다름)" 명시. **업종 표본 부족(peers<4, sectorValueScore=-1)** 시 기존엔 박스를 그냥 숨겼으나 → **가짜 숫자 없이 "표본 부족으로 업종 내 상대 밸류 미제공, 전체 풀 기준임, 업종 보정은 후속 과제" 안내 박스**를 노출. `peers<10` 저신뢰 경고 보존.
- **(7) 지표 가이드 보강** `src/app/guide/metrics/page.tsx`: 상단 고지 박스 아래 **"읽기 전 검토 포인트"** 박스 추가 — (a) 점수(0~100 절대값) vs 상대순위(전체 풀 내 위치) 차이, (b) 밸류 점수가 전체 풀 분위라 업종 편향 가능(금융·지주사 상위 쏠림)·종목 상세 업종 대비 밸류는 별도·종합점수 미포함. 기존 line 122 공통기준 문구와 중복 없이 보강. 비자문 톤.

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·SSG 138p, `/stock/[ticker]` 14 kB, exit 0
- 변경 6파일 금지표현(매수 추천/강력 매수/급등 예상/목표가/손절가/진입/따라 사기/AI 픽/매수 후보 등) grep = 0 (부정문 고지 "매수·매도 추천이 아닌"만 보존).
- 로컬 prod(127.0.0.1:**3251**, 내 리스너 PID 2140만 종료·운영자 3000/4310 무중단): 검증 5라우트 `/stock/005380 /stock/005930 /stocks /guide/metrics /status` 전부 HTTP 200, 에러 마커 0. SSR 확인: 종목 상세 `<ol>` 1개(번호 중복 0)·구 하단 칩 "관련 공시 확인" 0건·배지 `rounded-full`+"필수 데이터/이상값 점검 통과/Metrics 2.4"·"전체 상대순위"·"해석:"·"업종 대비 밸류"+"전체 풀 기준"·가이드 "읽기 전 검토 포인트"/"점수와 순위는 다릅니다"/"밸류 점수의 기준에 주의" 전수 렌더.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 종목 상세 상단 CTA 버튼 그룹(데스크톱 가로·390px 2열/줄바꿈 균등)·데이터 배지 3개 안 붙음·점수↔순위 구분 가독성·가로 오버플로우 0·콘솔 오류 0.

### 결정 / 잔여 리스크 / 다음
- (6) 업종 대비 밸류는 `sectorValueScore`가 PER·PBR 보유 동일업종 피어 **4개 이상**일 때만 점수 산출. 4개 미만이면 숫자 날조 대신 안내 박스 — 후속 과제: KRX 공식 업종코드 연동 시 표본 확대.
- 설계서 PART C/I/J 원문 미확보(레포 외부 PDF) — 추후 PDF 텍스트 추출본을 레포에 넣으면 잔여 항목 재대조 권장.
- 다음: 운영자 모바일 브라우저 게이트, 외부 릴리스(범위 외).

---

## 2026-06-25 · 1차 상용화 안정화 P0-A — 금지표현 교체·공통 고지 3줄·Metrics 2.4 단일출처 (Task 33, Claude)

### 목표
- ORNSCORE 1차 상용화 안정화 패치 P0-A. 신규 기능이 아니라 **신뢰도·문구 리스크·UI 기본기·검증 가능성** 강화. 설계서 PART A/B 기준. branch `ai-center/task-33-ornscore-1-p0-a-metrics`(시작 `533c6d2`, 클린·예상 일치). 점수 계산식·데이터 생성 **무변경**, 신규 npm 0·빌드 단계 추가 0.

### 완료한 작업
- **금지 표현(투자 조언처럼 보이는 표현) 교체** — 사용자 화면 문자열에서 제거. 부정문("…추천이 아니라/아닙니다", "…의미하지 않으며")은 고지로 보존:
  - `src/app/page.tsx` riskNote: "진입 전 급등 사유 확인"→"급등 사유 확인", "진입 시점과 비중 분할"→"비중·시점 분할".
  - `src/app/today/page.tsx` riskNote 동일 2건 + 과열 주의 caption "진입 전 급등 사유 확인"→"급등 사유 확인" + "🆕 신규 진입"→"🆕 신규 편입"(랭킹 편입 의미, '진입' 토큰 제거).
  - `src/components/ScoreTooltip.tsx`: "저평가 진입"→"저평가 국면".
  - `src/lib/metricReadings.ts`: "따라 사기 전, 급등 이유…"→"급등 이유…부터 확인하는 것이 우선", "지금이 진입 시점인지…"→"지금 살펴볼 시점인지 다음 분기를 기다릴지".
  - **보존(의도)**: `src/app/terms/page.tsx`("특정 종목·자산의 수익 보장"은 "제공하지 않습니다" 법적 고지 목록), `src/lib/metrics.ts`(코드 주석·비노출), 모든 부정문 고지.
  - 참고: "급등"(단독)·"추격매수 주의"는 금지 목록에 없고 위험 경고 톤이라 보존.
- **공통 고지 3줄을 홈 `RiskNotice`에 정확히 노출**(과잉 반복 회피 — 푸터 1줄 고지가 전역 페이지 커버):
  1. "오른스코어는 투자 추천이 아닌 데이터 기반 탐색 도구입니다."
  2. "모든 점수와 신호는 참고 정보이며, 매수·매도 추천이 아닙니다."
  3. "최종 투자 판단과 책임은 사용자 본인에게 있습니다."
  - 문구는 `src/lib/dataStatus.ts`의 `notices.disclaimer` 배열로 **단일 소스화**하고 `RiskNotice`가 이를 읽도록 연결(브랜드 토큰은 일관성 위해 "오른스코어" 유지).
- **Metrics 버전 표기 단일 소스 정리**: `src/app/universe/page.tsx` "산식 버전" 셀을 `dataMetadata.metricsVersion ?? "—"`(→"2.4") → `dataStatus.metricsVersionLabel`(→"Metrics 2.4")로 교체. 값은 동일, 전 화면 표기 포맷 통일.
- **검증 게이트 강화** `scripts/verify_metrics.py` FORBIDDEN에 다어절 금지 토큰 추가: 급등 예상·강력 매수·목표가·손절가·단기 급등주·무료 급등주·매수 후보·AI 픽·AI 추천·오늘 살 종목·따라 사기·진입 시점. **단독 "진입"·"매수 추천"은 제외**(정당한 부정문/단어 오탐 회피). 향후 회귀 차단.

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0(신규 토큰 포함) · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·172라우트 프리렌더 통과, exit 0
- 로컬 prod(127.0.0.1:**3257**, 내 리스너 PID 21788만 종료·운영자 3000/4310 무중단): 검증 9라우트 + `/compare`·`/universe` 모두 HTTP 200, 서버 로그 에러 0. SSR 확인: `/`에 공통 고지 3줄 정확 렌더, Metrics 2.4가 `/ /today /stocks /status /guide/metrics /universe` 전수(2.3·"Metrics v" 0), 기준일 2026.06.24 `/ /today /status` 일치. 11라우트 HTML 금지 토큰(진입·따라 사기·급등 예상·강력 매수·목표가·손절가·매수 후보 등) grep = 0, "매수 추천"은 전부 부정문.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: http://127.0.0.1:3000 재빌드·재기동 후 데스크톱/390px 브라우저 체크 권장** — 가로 오버플로우 0·콘솔 오류 0·홈 고지 3줄 가독성.

### 결정 / 잔여 리스크 / 다음
- 가격 기준일 "갱신 지연(delayed)" 상태는 **의도된 정직 표시**(직전 영업일 기준) — 숨기지 않고 상태 문구로 노출 유지.
- 게이트는 단독 "진입"/"매수 추천"을 검사하지 않음(오탐 회피). 신규 사용자 문자열 작성 시 수기 주의 필요.
- 다음: P0-B(설계서 잔여), 운영자 모바일 게이트 확인, 외부 릴리스(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 7 — /backtest KPI 수익/위험 분리·위험 안내 강화·월별 히트맵·MDD 차트·기여 Top/Bottom (Task 27, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 7(백테스트 페이지, §11.2~§11.5·§15·§20.7)**. `/backtest`를 평면 6카드에서 **수익/위험 분리 KPI + 강화된 위험 안내 + 월별 히트맵 + 낙폭(언더워터) 차트 + 기여 Top/Bottom 막대**로 리뉴얼. 점수 계산식·데이터 생성·`backtest-result.json` **무변경**, 비자문 톤(수익률만 강조 금지, `수익 보장`/`추천 전략`/`매수 신호` 금지), **신규 npm 패키지 0**(순수 CSS/SVG/HTML). branch `ai-center/task-27-ornscore-phase-7-kpi`(시작 `1ae9486`, 클린, `4f5b277` 라인 위).

### 완료한 작업
- **신규 `src/components/backtest/BacktestRiskNotice.tsx`**(서버): 위험·한계 안내 단일 소스. 과거 데이터 기반 시뮬레이션·**미래 수익 비보장**·**수수료·슬리피지·체결 지연·유동성 한계**·생존편향·미래참조 제거·지표 범위 한계를 항목으로 명시 + (옵션) 벤치마크/가정 줄. 실데이터·준비중 fallback 양쪽에서 재사용해 기존 상·하단 amber 문단 2개를 흡수(중복 제거).
- **신규 `src/components/backtest/MonthlyHeatmap.tsx`**: 연도(행)×월(01~12 열) 순수 CSS 그리드 히트맵. 그동안 미사용이던 `monthlyReturns`를 표면화. 셀 색은 정적 Tailwind 리터럴 9버킷(상승=red·하락=blue·0/미보유=zinc, 런타임 합성 0). `overflow-x-auto`+`min-w-[560px]`로 390px 가로 넘침 회피, `title`/`aria-label`에 연·월·% 노출.
- **신규 `src/components/backtest/DrawdownChart.tsx`**: `equityCurveMonthly.equity`의 직전 고점 대비 낙폭(언더워터)을 순수 SVG 면적으로. 최저점(최대낙폭) 월 표시·`maxDrawdown` 주석. EquityChart와 동일 viewBox+`w-full h-auto` 반응형, `role="img"`+`aria-label`. 하락=파랑.
- **신규 `src/components/backtest/ContributionBars.tsx`**(서버): `contributors`를 pnl 부호로 **수익 기여 상위 / 손실 기여 상위** 2그룹 가로 막대. 그룹 내 max |pct| 기준 길이, 수익=red·손실=blue, 각 행 `/stock/{ticker}` `prefetch={false}` 링크(`names[ticker]`+부호 pct%). 데이터 없으면 렌더 안 함(날조 금지).
- **변경 `src/components/BacktestClient.tsx`**: 평면 6카드 metricCards 제거 → **수익 그룹**(CAGR·총수익률 vs 벤치·누적 초과수익) / **위험 그룹**(MDD vs 벤치·Sharpe vs 벤치·승률) 2박스로 분리(`KpiCell`, 인라인 벤치 보조줄). 위험 그룹은 rose 테두리/배경+`ShieldAlert` 아이콘+"위험" 라벨로 색만으로 전달하지 않게(§20.7). 인라인 amber 문단 → `BacktestRiskNotice`. EquityChart 아래 `DrawdownChart`→`MonthlyHeatmap`→연도별 막대→`ContributionBars`+보유 칩 순. 전략 탭·composite 기본 보존, 기존 균형 경고문장 유지.
- **변경 `src/app/backtest/page.tsx`**: 준비중 fallback에 `BacktestRiskNotice` 추가(badges 아래).

### 결정 / 잔여
- MDD를 사이트 등락 색(상승=red) 과 혼동되지 않게 **위험 그룹 전체를 rose 톤+아이콘+라벨**로 분리(값 자체도 rose). 수익 그룹은 기존 등락 의미색(상승=red/하락=blue) 유지.
- 상·하단에 흩어져 있던 amber 주의 문단 2개를 단일 `BacktestRiskNotice`로 통합(중복 축소). `BacktestLimitBadges`는 그대로 상단 유지.
- 성과 기여는 전략별 `contributors`(상위 9종목 누적) 데이터만 제공 — 시점별 기여 시계열은 데이터가 없어 후속 과제로 남김(억지 생성 안 함).

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/backtest` 7.24 kB, exit 0
- 로컬 prod(127.0.0.1:3255, 내 리스너 PID 15684만 종료·운영자 3000/4310 무중단): `/backtest`·`/today`·`/stocks`·`/stock/005380` 모두 HTTP 200, 에러 마커 0. `/backtest` SSR에 수익/위험 그룹·위험 안내(수수료·슬리피지·체결 지연·유동성·미래 수익 비보장)·월별 수익률 히트맵·낙폭(언더워터)·수익/손실 기여 상위·인라인 벤치(총수익률 +290.5%/MDD −28.0%/Sharpe 0.98) 전수 렌더. 신규/변경 파일 금칙어(수익 보장/추천 전략/매수 신호/급등 예상) grep = 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 KPI 수익·위험 2박스(1열↔2열)·히트맵 `overflow-x-auto` 가로 넘침 0·낙폭 차트 반응형·기여 막대 1열↔2열·콘솔 오류 0.

### 다음에 바로 실행할 작업
- 백테스트 생존편향 실해결(시점별 유니버스 재구성, 큰 작업) — 현재는 안내 문구. 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 6 — /disclosures 공시 신호 카드 피드·타입 색/아이콘·이해하기 UX (Task 26, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 6(공시 신호 페이지, §10.2~§10.6·§15·§20.7)**. `/disclosures`를 테이블식 나열에서 **상단 카드형 요약 대시보드 + 이벤트 피드 카드**로 리뉴얼. 공시 분류 로직·API fallback·점수/데이터 생성 **무변경**, 비자문 톤(호재/악재 단정 금지), 신규 npm 패키지 0. branch `ai-center/task-26-ornscore-phase-6-ux`(시작 `8b2ac57`, 클린, `4f5b277` 라인 위).

### 완료한 작업
- **신규 단일 소스 `src/lib/disclosureType.ts`**: `signalType` → `{label, shortLabel, Icon(lucide), badgeBg/Text/Border, dot, cardBorder}` 매핑 + `DISCLOSURE_TYPE_ORDER`(자사주·보유변동·대형계약·손익정정·유증/CB) + `typeMetaOf()`. **설계서 §10.4 색**: 자사주=초록, 보유변동=보라, 대형계약=청록(teal), 손익정정=주황(amber), 유증/CB=빨강. 전부 **정적 Tailwind 리터럴**(런타임 색 합성 0 — purge 누락 회피). 색은 항상 텍스트 라벨·아이콘·도트와 함께(§20.7). 미분류는 중립 회색 폴백.
- **신규 `src/components/disclosures/DisclosureSummaryCards.tsx`**(presentational): 타입별 요약 카드 **항상 5개** 노출(`grid-cols-2`→`sm:3`→`lg:5`). 아이콘+타입 라벨(텍스트 배지)+묶음 수+캡션("최근 N일 · M건" / "이벤트 없음"). 0건은 muted 상태. 호재/악재 표현 없음.
- **`src/components/DisclosureExplorer.tsx` 리팩터**:
  - 타입별 묶음 수(`signalCounts`)·기간을 `<DisclosureSummaryCards>`로 전달, 필터 칩 위에 렌더.
  - 하드코딩 `SIGNAL_STYLES`(signalLabel 키)·`CANON_TYPES` 제거 → 필터 칩·카드 배지/테두리를 **`typeMetaOf(g.signalType)`**에서 읽음. 칩에 타입 도트 추가. 방향 배지(긍정 가능=red/부정 가능=blue/확인 필요=amber)·건수 배지 로직 보존.
  - 각 묶음을 **이벤트 카드**로 재구성: 좌측 4px 타입색 테두리 + 상단(타입 아이콘+텍스트 배지 "{label}·자동분류" / 방향 / N건) → 종목명·코드·제출일 → 한 줄 의미(`SIGNAL_DESCRIPTIONS`/note) → **구분된 "확인할 것" 라인**(가이드 checkPoints[0]) → 액션 행(원문 보기 ↗ / 종목 보기 → / 관심 / 이 공시 이해하기). 모든 터치 타깃 `min-h-[44px]`, `flex-wrap`·`min-w-0`·`break-words`로 390px 넘침 회피. 로딩 스켈레톤·에러 블록·빈 상태·SSR `initialData` fallback 보존.
- **`src/components/SignalGuideExpand.tsx`**: `url` prop 추가 → 펼침 내부에 **DART 원문 보기 링크**(§10.6 모달 구성요소: 공시 타입·일반적 의미(oneLine/whyMatters)·확인 항목(checkPoints)·원문 링크). 헤더 이모지를 `disclosureType` **타입 아이콘+색**으로 교체해 카드와 일관화. 트리거 버튼 `min-h-[44px]`로. 기존 중립 문구·고지 보존.

### 결정 / 잔여
- **"이 공시 이해하기" 결정**: 설계서 §10.6은 "긍정적/부정적으로 볼 수 있는 경우" 섹션을 예시하나, **자문 톤("좋은 신호"/매수/호재) 없이 깔끔히 분리하기 어려워 기존 인라인 펼침을 유지**(이미 일반적 의미·확인 항목·과거 패턴·주의·원문을 모두 노출). 호재/악재 단정 금지 지침 우선. 모달 대신 코드베이스에 이미 있는 **인라인 펼침** 방식 채택.
- 색 충돌: capital_raise(빨강)와 방향 배지 "긍정 가능"(빨강)은 별개 배지+다른 텍스트라 혼동 낮음(지침대로 방향 매핑 보존).
- `StockDisclosures.tsx`(종목 상세)의 `SIGNAL_BG`는 무변경 — 이번 retone은 `/disclosures` 한정(상세 회귀 0).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/disclosures` 11.1 kB, exit 0
- 로컬 prod(127.0.0.1:3253, 내 리스너 PID 2412만 종료·운영자 3000/4310 무중단): `/disclosures`·`/today`·`/stock/005380` 모두 HTTP 200. `/disclosures` SSR에 5개 요약 카드 라벨(자사주/보유 변동/대형 계약/손익 정정/유증/CB)·5색 토큰(green/purple/teal/amber/red 전수)·이벤트 마커(자동분류 9·이 공시 이해하기 10·원문 보기 9·확인할 것 5)·요약 캡션 렌더, 에러 마커 0. 신규/변경 4파일 금칙어 grep = 비자문 부정문("호재/악재 단정 없이"·"매수로 단정 금지")만.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 요약 카드 2열↔5열·타입 색 밴드·이벤트 카드 가로 넘침 0·"이 공시 이해하기" 펼침·터치 44px·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 7(백테스트 차트·손실 기여 막대). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 5 — /stock 상세 게이지·지표 카드·업종 비교 시각화 (Task 25, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 5(종목 상세 페이지, §9.2~§9.7·§14·§15)**. 이미 끝난 Task #15 결론 카드(`StockConclusionHero`)와 Task #23 디자인 톤 위에서 그 아래/주변 점수 해석·비교 시각화를 **강화**(결론 카드는 갈아엎지 않음). branch `ai-center/task-25-ornscore-phase-5`(시작 `5381720`, 클린). 점수 계산식·데이터 생성·JSON-LD·breadcrumb·`generateMetadata`/`generateStaticParams`·`StockTabs` 탭 id/순서·가격 동기화(`displayPrice`/`displayChangePct`)·`surge3m`/`riskAlert`·관심/비교/공유 슬롯 **무변경**, 비자문 톤, 신규 npm 패키지 0.

### 완료한 작업
- **Goal 1 · 탐색 우선도 게이지**: `src/components/stock/PriorityScoreCard.tsx`를 기존 `@/components/ui/ScoreGauge`(size 88·showLabel·showOutOf)로 점수를 주인공화. 전체/업종 순위·필수 데이터 %·이상값 점검·산식 버전 행 전부 보존. **suspect(이상값 점검 중)에는 게이지 대신 회색 숫자만** 노출(매수 게이지처럼 보이지 않게). props 시그니처 무변경 → `StockConclusionHero` 호출부 그대로.
- **Goal 2 · 4지표 카드**: 신규 `src/components/stock/MetricInsightCards.tsx`(서버, 훅 0). 카드마다 지표명+`ScoreTooltip`, 원점수·상위/하위 백분위, `scoreColorOf` 밴드 막대, 한 줄 해석, **확인/주의 태그**(tone=caution면 주황 "주의", 아니면 파랑 "확인"). 1열(모바일)→2열(sm↑). `MetricStrip` 섹션을 대체.
- **해석 문구 단일화**: `BeginnerReading.tsx`의 `readMomentum/readFlow/readValue/readVol`+`getChecklistByPattern`을 **신규 `src/lib/metricReadings.ts`로 추출**(문구 바이트 동일·순수 함수). 초보자 카드와 지표 카드가 같은 소스 사용. 점수 계산 무관, 표시 문구 출처만 이동.
- **Goal 3 · 초보자 카드 강화**: `BeginnerReading.tsx` 제목을 설계서대로 **"초보자는 이렇게 보세요"**로, 헤드라인(패턴) 아래 **순서형 "먼저 확인할 것"(점수→공시→재무, §9.5)** ol 추가(각 단계 `#basis`/`#disclosures`/`#financials` 앵커). 기존 패턴별 항목은 "이 종목에서 특히 볼 것"으로 유지, 매수·매도 추천 아님 고지·앵커 칩 보존.
- **Goal 4 · 업종 비교 시각화**: 신규 `src/components/stock/SectorComparison.tsx`(서버). 행마다 순위 배지·종목명(`/stock/{ticker}` `prefetch={false}`)·**가로 종합점수 막대(scoreColorOf 밴드색)**·PER/등락 보조·현재 종목 ring+bg+"현재" 태그. `overflow-x-auto`(min-w-280)로 390px 가로 넘침 회피. **표본 부족(sectorCount<2) 시 안내 빈 상태**. page.tsx의 기존 `<table>` 블록을 대체(점수는 page에서 1회 계산해 `sectorRows`로 전달, 재계산 없음). 업종 밸류 칩·"업종 전체 →" 링크 유지.
- **Goal 5 · 다음 액션 버튼**: `src/components/stock/NextActionButtons.tsx` 4개 앵커(공시 확인/재무 보기/점수 근거/업종 비교 → `#disclosures`/`#financials`/`#basis`/`#summary`) 라벨·아이콘 정돈, 44px 터치·2열(모바일)/4열(lg) 유지. 관심/비교 추가는 상단 헤더 실제 버튼이 담당 → 죽은 링크 날조 안 함.
- **page.tsx 와이어링**: `MetricStrip` import 제거(미사용)→`MetricInsightCards`/`SectorComparison` 추가, 지표 섹션·업종 `<table>` 대체. "지표 가이드 →" 링크·"전체 N종목 대비" 캡션 보존.

### 결정 / 잔여
- **suspect 게이지 회피**: 이상값 점검 중인 종목은 밴드색 게이지가 매수 신호처럼 보일 수 있어 회색 숫자(`/100`+⚠)로 유지 — Task #15 suspect 톤과 일관.
- **밸류 카드 해석**: `readValue`가 PER·PBR 문구를 쓰므로 `MetricInsightCards`의 밸류 항목에만 `per`/`pbr`을 넘김(다른 지표는 점수만). 계산 무관·표시 전용.
- `MetricStrip.tsx`는 더 이상 상세에서 쓰이지 않으나 컴포넌트 파일은 잔존(다른 화면 영향 없음, 삭제는 범위 외).

### 테스트 결과
- `npx tsc --noEmit`: exit 0 (전후 2회)
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/stock/[ticker]` 13.9 kB·138p SSG 프리렌더, exit 0
- 로컬 prod(127.0.0.1:3251, 시작 PID 15780만 종료·운영자 3000/4310 무중단): `/stock/005380`·`/stock/005930`·`/stocks`·`/today` 모두 HTTP 200. `/stock/005380` SSR에 탐색 우선도 게이지(aria "종합 점수")·자체 지표 4종(확인×2/주의×2)·"초보자는 이렇게 보세요"+"먼저 확인할 것"·"같은 업종 비교"+막대 범례 전수 렌더, 에러 마커 0. 신규/변경 파일 금칙어(추천/매수/매도/수익기대/급등예상/상승가능성) grep = 비자문 부정문("추천이 아닙니다")·기존 보존 문구만.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱/390px에서 게이지 가독성·지표 카드 1열↔2열·업종 비교 막대 `overflow-x-auto` 내 가로 넘침 0·다음 액션 44px 터치·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 6(공시 카드 피드·타입별 색/아이콘·해석 모달), Phase 7(백테스트 차트). 전역 라이트 토큰(#F6F8FB) 미도입(범위 외).

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 4 — /stocks 점수 히트맵 표/카드 보기모드 (Task 24, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 4(종목 탐색 페이지, §8.5·§8.6·§15.5·§20.5)**. 이미 끝난 Task #16 질문형 프리셋/필터 위에 **2차 고도화** — 되돌리거나 중복 구현 안 함. branch `ai-center/task-24-ornscore-phase-4`(시작 `4f5b277`, 클린). 점수 계산식·데이터·필터 파라미터·저장검색/알림/테마 딥링크 **무변경**, 비자문 톤, 신규 npm 패키지 0.

### 완료한 작업
- 신규 `src/components/stocks/StockResultsTable.tsx`(presentational): 데스크톱 점수 히트맵 테이블. 11컬럼(종목명·업종·현재가·등락률·종합점수·추세·거래활성도·밸류·위험조정·신호·액션). 점수 5컬럼은 `scoreColorOf` 밴드(80↑ blue/60~79 sky/40~59 amber/<40 zinc) 그대로 칠한 `ScoreHeatCell` 배지(정적 Tailwind 리터럴, 런타임 합성 0). `overflow-x-auto`로 감쌈, 행/액션은 `/stock/{ticker}` `prefetch={false}` 링크, 등락률 색 카드와 동일(상승 red·하락 blue). `deriveSignals`(점수 파생 강점/주의) export.
- 변경 `src/components/StocksExplorer.tsx`:
  - 보기 방식 전환(카드형/표형) 세그먼트 컨트롤 추가 — **데스크톱 전용(`hidden lg:inline-flex`)**, 선택은 `localStorage("stocks-view-mode")`에 보존(기본 카드형, useEffect 복원).
  - 표형 선택 시 데스크톱은 `StockResultsTable`, 모바일(<lg)은 카드형 강제 유지(`lg:hidden`). 카드형/표형 모두 "상위 100개" footnote 공통.
  - 카드 신호 칩 인라인 도출을 표와 공유하는 `deriveSignals`로 통일(중복 제거). 카드 헤더에 업종 보조표기 추가.
  - 빈 상태(§20.5) 개선: `strongestConstraint()`로 가장 강한 단일 조건을 골라 "○○ 조건이 강해 결과가 없습니다" 명시 + **"가장 강한 조건 완화"**(그 조건만 해제·activePreset 클리어) / **"전체 종목 보기"**(초기화) 2버튼.
- 변경 `src/app/stocks/page.tsx`: 뷰모델에 `sector: sectorOf(s.themes)` 추가(홈/오늘 후보 카드와 동일 소스). `StocksExplorer` Stock 인터페이스에 `sector?: string`.

### 결정 / 잔여
- **공시/신호 컬럼**: 클라이언트 컴포넌트에서 종목별 공시 실데이터를 동기 접근할 수 없어 **"신호"로 라벨**하고 점수 파생 칩(추세 강함/거래 활발/과열·급등 주의 등)을 노출 — "공시 있음" 플래그 **날조 안 함**. 실 per-stock 공시 데이터셋이 페이지에 연결되면 그때 교체.
- 모바일은 테이블 미사용(설계서 §8.6·§15.1) — 표형을 골라도 <lg에서는 카드형. 토글 자체가 `hidden lg:inline-flex`라 모바일에서 표형 도달 불가. 모바일 약어 범례(추/거/저/위)·하단 바텀시트 필터 보존.
- `strongestConstraint` strength는 표시·랭킹용 휴리스틱(점수 계산 무관).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트 통과, `/stocks` 13.9 kB, exit 0
- 로컬 prod(127.0.0.1:3251, 시작 PID만 종료·운영자 3000/4310 무중단): `/stocks`·`/stocks?theme=반도체`(인코딩)·`/today`·`/stock/005930` 모두 HTTP 200. `/stocks` SSR에 카드형/표형 토글·정렬/컬럼 라벨 렌더, 에러 마커 0. 신규/변경 파일 금칙어(추천/매수후보/수익기대/급등예상/상승가능성/매도) grep 0.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — 데스크톱(≥1024px) 카드형↔표형 토글·표 점수 히트맵 색 밴드·가로 오버플로우 0, 390px 모바일은 표형 토글 미노출·카드형 유지·가로 오버플로우 0·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 5(`/stock` 상세 게이지 확장·업종 비교 시각화), Phase 6(공시 카드 피드·해석 모달), Phase 7(백테스트 차트). 실 per-stock 공시 데이터셋 연결 시 표 "신호" 컬럼 → "공시" 교체.

---

## 2026-06-25 · 비주얼 리뉴얼 Phase 3 — /today 대시보드화 (Task 23, Claude)

### 목표
- 설계서 `ornscore_design_improvement_spec.md` **Phase 3(오늘 페이지 리뉴얼, §7·§15.2·§16.4)**. `/today`를 정보 나열형에서 홈 리뉴얼과 같은 금융 대시보드 첫인상으로 끌어올림. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤, 신규 npm 패키지 0. branch `ai-center/task-23-ornscore-phase-3`(시작 `387f6b4`, 클린). 이미 끝난 홈(#21/#22)·필터(#16)·상세(#15)·신뢰 배지(#17/#18)는 **재사용**(중복 구현 안 함).

### 완료한 작업
- 신규 4파일 `src/components/today/`:
  - `TodayStatusBar.tsx` — 페이지 최상단 데이터 상태 바. 전역 `dataStatus` 단일 소스만 읽어 데이터 상태·주가 기준일·공시 기준·산식 버전을 한 줄로(데스크톱 가로 / ≤390px 줄바꿈). 신뢰 배지(DataStatusBadge·AsOfDateBadge·MetricsVersionBadge) 재사용.
  - `TodayTopSection.tsx` — 오늘의 Top 3 큰 카드. 홈 `StockCandidateCard` 재사용(게이지+4지표 막대+강점/주의+CTA), grid 1→sm:2→lg:3.
  - `SignalSection.tsx` — 신호별 섹션 컨테이너(제목·캡션·반응형 그리드·footnote·EmptyState). 데이터 없으면 억지로 채우지 않고 빈 상태 안내.
  - `SignalStockCard.tsx` — 컴팩트 종목 카드(ScoreGauge 56 + 이름/코드/업종/가격/등락 + 한 줄 신호 + 카드 전체 링크). 과열 주의는 caution amber 톤.
- 변경 `src/app/today/page.tsx`:
  - 추가: 최상단 상태 바, 시장 KPI 4카드(홈 `MarketSnapshotCards` 재사용 — 분석 종목/종합 80+/거래활성도 급증/공시 신호), Top3, 신호별 6섹션(종합 점수 상위·거래활성도 급증·밸류 매력·추세 강함·과열 주의·최근 공시 있음).
  - 대체(중복 제거): 기존 3 KPI(분석 종목/PER·PBR 중앙값) → 시장 KPI 4카드. `StockTabs`(종합/저평가/추세) → 신호별 6섹션. 하단 amber 공시 블록 → "최근 공시 있음" 섹션 흡수.
  - 보존: 오늘의 브리핑+AI 인사이트, 최근 장마감 변화, 체크리스트, 푸터 고지.

### 결정 / 잔여
- 이중 CTA(자세히 보기+비교 추가) → **단일 CTA**로 축소: `/compare`는 `?add=` 파라미터 미지원(localStorage 기반)이라 동작 안 하는 링크를 날조하지 않고 `자세히 보기`(/stock)만.
- KPI '거래활성도 급증'은 `homeSnapshot.volumeSpikeCount`(거래대금 5d/20d ratio≥1.5, 폴백 flow≥75) **파생 추정** — 캡션·footnote에 명시. 실 데이터 생기면 헬퍼만 교체.
- 모바일은 테이블 축소 대신 **카드 세로 스택**(grid-cols-1)으로 390px 오버플로우 구조적 회피(§7.5 가로 스냅 스크롤은 후속 옵션).

### 테스트 결과
- `npx tsc --noEmit`: exit 0
- `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 python scripts/verify_metrics.py`: 138종목 0오류 · 금칙어 0 · Metrics 2.4 일치, exit 0
- `npm run build`: 타입게이트·172 pages, `/today` 854 B, exit 0
- 로컬 prod(127.0.0.1:3250, 운영자 3000/4310 무중단): `/today / /stocks /stock/005380` 모두 HTTP 200. `/today` SSR에 데이터 상태 바·KPI 4·Top3/신호 카드 게이지 34개(aria "종합 점수")·6섹션 제목 전수 렌더, 에러 마커 0. 금칙어 grep = 고지 부정문만.

### 게이트 한계 / 운영자 요청
- Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장** — `/today` 360~390px 가로 오버플로우 0·상태 바 줄바꿈·KPI 2열·Top3 1열 스택·신호 카드 게이지·CTA 44px·콘솔 오류 0.

### 다음에 바로 실행할 작업
- Phase 4(`/stocks` 점수 히트맵 테이블), Phase 5(`/stock` 상세 게이지 확장), Phase 6(공시 카드 피드), Phase 7(백테스트 차트). 실 거래량 급증 데이터 소스로 `volumeSpikeCount` 교체.

---

## 2026-06-25 - 비주얼 리뉴얼 #21/#22 공개 반영 마무리 (Codex)

### 완료한 작업
- 최신 `origin/main`의 daily refresh 데이터 위에 Task #21/#22 홈 비주얼 리뉴얼 커밋만 cherry-pick해 배포 후보 브랜치 `codex/ornscore-visual-renewal-finish` 구성
- 데이터 파일 되돌림 없이 홈 Hero, ScoreGauge/ScoreBadge/MetricBar/MetricChip, 후보 카드 비주얼 개선을 main에 반영
- `origin/main`에 `0a621d7`, `a1f2a4e` 푸시 완료
- 로컬 3000 preview를 새 빌드 기준으로 재시작해 사용자가 바로 확인 가능하게 열어둠

### 테스트 결과
- `npx tsc --noEmit`: 성공
- `python scripts/verify_metrics.py`: 성공, 138종목 오류 0건, 금칙어 0건, Metrics 2.4 일치
- `npm run build`: 성공, 172 static pages 생성
- 로컬 smoke: `/`, `/stocks`, `/stock/005930`, `/guide/metrics` 모두 HTTP 200
- 브라우저 확인: desktop/mobile에서 deep-blue Hero, white CTA, 점수 게이지 6개 렌더링, 390px 모바일 가로 넘침 없음

### 현재 상태
- 로컬 preview: `http://127.0.0.1:3000/`, PID 9372
- 공개 배포: GitHub `main` 푸시 완료, Vercel/도메인 반영 대기 또는 확인 단계

### 다음에 바로 실행할 작업
- `https://ornscore.com/` 반영 여부 확인
- 남은 디자인 확장은 `/today`, `/stocks`, `/stock/[ticker]`로 점수 UI를 확장하는 별도 작업으로 진행

> 최종 설계서(33섹션) 기준 진행 추적. 세션이 끊겨도 이 파일로 이어간다.
> 규칙: 작은 단위 plan→실행→검증(구문/compile)→기록. 위험한 것만 사용자 확인.
> 검증 도구: `node /tmp/syntaxcheck.js`(TS 구문) · `python3 scripts/verify_metrics.py`(데이터+브랜드 게이트) · Vercel 빌드(최종 타입게이트).
> 제약: OneDrive 폴더 → python/bash로만 편집(Edit 도구 한글 깨짐). 대괄호 경로 git add는 `--literal-pathspecs`. push 전 `git pull`(봇이 매일 커밋).
> ※ 검증 메모(Task 20): 이 세션에서 Edit 도구가 한글/UTF-8/LF를 보존함을 확인(편집 후 `xxd` 바이트 검사, `git diff --stat`이 변경 줄만 표기·전체 reflow 없음). surgical Edit는 안전, 다만 신규 파일 대량 작성은 기존 python 방식 권장.

## 2026-06-24 · 홈 비주얼 임팩트 강화 1.5차 — 딥블루 Hero + 점수 주인공화 (Task 22, Claude)
- 목표: Task 21(`a70d4b3`, 클린) 위에서 홈 첫 화면이 "확실히 달라졌다"고 느낄 만큼 시각 임팩트·금융 대시보드감을 강화. 설계서 `ornscore_design_improvement_spec.md` §2.1·§2.2·§6·§23. 기존 ScoreGauge/ScoreBadge/MetricChip/MetricBar/scoreColor 기반 **유지·개선**. 점수 계산식·데이터 생성·공시 분류 **무변경**, 비자문 톤, 신규 패키지 0, `layout.tsx` `max-w-5xl` 셸 무변경. branch `ai-center/task-22-ornscore-1.5`.
- 변경 3파일:
  - `home/HomeHero.tsx`: 배경을 **딥블루 패널**(`from-blue-800 via-blue-900 to-slate-900`, 다크 `from-blue-950 …`)로 전환 — 마케팅 그라데이션/`bg-clip-text` 장식 제거하고 차분한 금융 SaaS 톤. 좌측 화이트 카피(강조어 `text-sky-300`), 우측은 딥블루 위 **흰 카드 '미리보기 화면'**(`shadow-xl`·`ring`·상단 구분선)로 시각 무게를 또렷이 분리. 1순위 **ScoreGauge 80→104px**(showLabel+showOutOf, 여백↑) 주인공화, 2~3순위 컴팩트 랭킹 행(업종 보조). 하단 **KPI strip**을 아이콘+큰 숫자로 재구성(설계서 §6.4 순서: 공시 신호/거래활성도 급증/종합 80↑). primary CTA = 흰 solid(`bg-white text-blue-800` dominant), secondary = 흰 outline, 둘 다 `min-h-[44px]`+`focus-visible`. 짧은 1줄 고지 유지(상세는 하단 RiskNotice).
  - `home/StockCandidateCard.tsx`: 위계 재정렬(종목명 16px bold → 업종·코드 → 가격 → **ScoreGauge 72→84px showLabel** 핵심화 → 4지표 막대(연한 패널로 묶음) → 강점/주의 → CTA). 강점=초록 ✓ 마커+칩, 주의=주황 ! 마커+박스로 스캔 용이하게 분리. 모바일 1열·44px 유지, page.tsx 비자문 텍스트 그대로.
  - `lib/scoreColor.ts`: `good`(60~79) 밴드가 라이트모드에서 가장 약해 `fill`/`barFill` sky-500 → **sky-600** 대비만 소폭 강화(4밴드 임계·라벨·다크변형 불변). 전 클래스 정적 리터럴 유지(런타임 합성 0 — task-21 회귀 가드).
- 검증: `npx tsc --noEmit` exit 0(전후) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 2.4, exit 0) · `npm run build`(타입게이트·138p, exit 0) · 빌드 CSS에 4밴드 라이트+다크 bg/text + 딥블루 프레임(`from-blue-800`·`from-blue-950`·`via-slate-950`·`bg-sky-600`·`bg-sky-400`) 전수 존재(task-21 클래스 누락 회귀 0) · 로컬 prod(127.0.0.1:**3200** — 3100은 직전 세션 stale 서버 점유 회피, 운영자 3000 무중단) `/ /stocks /stock/005930 /guide/metrics` 200·에러 0. 홈 SSR: 104px·84px 게이지·딥블루 프레임·흰 primary CTA·KPI 3종·aria 게이지 6·강점/주의 5/5 렌더. 변경 3파일+ui/ 금칙어 grep 0.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR/CSS grep+build 대체. **운영자: 재빌드→3000 재기동 후 브라우저 체크 권장**(360~390px Hero 스택·104px 리드 게이지·후보 카드 비빽빽·KPI 줄바꿈·CTA 44px·밴드 색).
- 잔여 리스크/다음: (1) 직전 세션 leftover `next start`가 3100 점유(PID 21332) — 운영자 정리 가능. (2) 딥블루 Hero·새 게이지는 홈 한정 — `/today` KPI/Top3·`/stocks` 히트맵·`/stock` 상세 게이지 확장이 다음(설계서 §7·§8.5·§9.3). (3) 전역 라이트 토큰(#F6F8FB)·외부 공개 주소 미갱신(범위 외).

## 2026-06-24 · 비주얼 리뉴얼 1차 — 홈 Hero + 점수 UI 기초 (Task 21, Claude)
- 목표: 설계서 `ornscore_design_improvement_spec.md` Phase 1(디자인 시스템 기초) + Phase 2(홈 리뉴얼) 일부 적용. 첫 화면에서 "점수 기반 한국 주식 탐색 대시보드"라는 인상을 강화하고, 점수를 서비스 주인공으로 만든다. 점수 계산식·데이터 생성·공시 분류 로직 **무변경**, 비자문 톤 유지. branch `ai-center/task-21-ornscore-1-hero-ui` @ `3e7b13e`(클린)에서 시작. 미리보기는 **http://127.0.0.1:3000**, 외부 공개 주소 갱신은 이번 범위 아님.
- 신규 디자인 시스템(재사용 기반):
  - ⭐ `src/lib/scoreColor.ts`: 점수→색/라벨 단일 소스(설계서 §5.4). 4구간 `{band,label,text,bg,border,badge,fill,track}` — 80↑ `강한 탐색 우선순위`(blue)·60~79 `확인 가치 있음`(sky)·40~59 `중립`(amber)·40↓ `우선순위 낮음`(zinc). 색만으로 전달 안 하게 모든 구간 한글 라벨 동반, 라이트/다크 변형 유지. `score.ts`·`grade.ts` 무변경.
  - ⭐ `src/components/ui/` 신규 4종(전부 서버 컴포넌트, 클라 훅 없음): `ScoreGauge`(순수 SVG 원형 게이지, stroke=currentColor로 다크 대응, 큰 tabular-nums 점수+구간 라벨+`aria-label`), `ScoreBadge`(점수+라벨 pill), `MetricChip`(지표명+값 칩, neutral/strong/muted 톤), `MetricBar`(0~100 가로 막대, 구간색 `text-*`→`bg-*` /g 치환, 점수 숫자 동반).
- 홈 리뉴얼:
  - `home/HomeHero.tsx`: 메인 카피 `오늘 볼 한국 주식, 점수로 먼저 좁혀보세요.`(§6.3), CTA `오늘 후보 보기`(#today-candidates)·`지표 이해하기`(/guide/metrics). 우측을 ad-hoc 4-스탯 dl → **대시보드 미리보기 카드**로 교체: 1순위 큰 `ScoreGauge`+강점 칩, 2~3순위 `ScoreBadge` 컴팩트 행, 80↑/거래급증/공시 3-스탯 요약. 배경 톤 blue/cyan 그라데이션 → 차분한 slate/blue 금융 톤(다크 변형 보존). props에서 미사용 upCount/downCount 제거, `previewCandidates`(top3) 추가.
  - `home/StockCandidateCard.tsx`: 종합점수를 `ScoreGauge`(size 72)로 주인공화, 4지표를 `MetricBar` 4줄로 시각화, **강점**(emerald `MetricChip`) vs **주의**(amber 박스) 명확 분리. 종목 메타에 업종(`sectorOf`) 추가. 모바일 grid-cols-1 세로 스택·CTA `min-h-[44px]` 유지.
  - ⭐ `home/FeatureCards.tsx`: 핵심 기능 3개 카드(§6.5) — 오늘의 후보(종합 80↑ N개)·공시 신호(최근 N건)·백테스트(위험 지표 포함). **홈에 없던 백테스트 진입점** 추가. `page.tsx`에서 DisclosureSignalSection 다음에 배치.
  - `app/page.tsx`: 후보 뷰모델에 `sector`+`m{momentum,flow,value,vol}` 추가(기존 `compositeOf`/`isSuspect`/`pickTopStocks`·카운트 무변경), Hero에 top3 전달, FeatureCards 연결.
- 고지 완화: 첫 화면(above-the-fold)은 Hero 하단 1줄 차분한 고지(`투자 추천이 아닌 데이터 기반 탐색 도구`)만, 상세 고지 박스(`RiskNotice`)는 하단 신뢰 레이어로 유지(§17).
- 카피 안전: 신규 문자열 전부 비자문(탐색 우선순위·확인 가치·강점·주의·확인 필요). 추천/매수/매도/수익 보장 톤 0 — 새/수정 파일 grep 시 `투자 추천이 아닌`(고지 부정문) 1건만.
- 검증: `npx tsc --noEmit` exit 0(전후 2회) · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID(20584)만 taskkill, 3000·4310 무중단) `/ /stocks /stock/005930 /guide/metrics /backtest /disclosures` 전부 200·에러 마커 0. SSR grep: 메인 카피·미리보기 헤더·게이지 `aria-label="종합 점수"` 6개·강점 5블록·`위험조정` 막대 26개·`<svg` 35개·핵심기능/백테스트 카드·band 라벨 24개 렌더 확인.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 자동 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: 재빌드→3000 재기동 후 AI Center 브라우저 체크 권장**(stale 청크 회피) — 360~390px에서 ScoreGauge 가독성·후보 카드 세로 스택·터치 44px·band 색(blue/sky/amber/zinc) 확인.
- 잔여 리스크/결정: (1) 신규 점수 컴포넌트는 **홈에만** 적용 — `/stocks` 테이블·`/stock` 상세는 기존 UI 유지(다음 작업으로 재사용 확장 보류). (2) 밝은 금융 톤과 기존 다크 모드 공존 — 새 컴포넌트는 다크 변형 유지하나 전역 라이트 토큰 전환(#F6F8FB)은 미적용(범위 외). (3) `MetricBar`의 `text-*`→`bg-*` /g 치환은 토큰 네이밍 규약 의존(scoreColor가 `text-` 접두사 보장). (4) 외부 공개 주소 미갱신(범위 외).
- 다음 추천 작업: (a) 점수 컴포넌트를 `/stocks` 테이블 히트맵·`/stock/[ticker]` 상세 게이지로 확장(설계서 §8.5·§9.3, Phase 4·5). (b) Phase 3 오늘 페이지(`/today`) KPI/Top3 카드 리뉴얼. (c) 전역 라이트 금융 토큰(#F6F8FB) 도입 검토. (d) Playwright 모바일 게이트 자동화.

## 2026-06-24 · 세부 디자인·UX 다듬기 — 모바일/배지/문구 일관화 (Task 20, Claude)
- 목표: 원본 요청대로 큰 개편 없이 OrnScore 최근 작업(Task 14~18)의 거칠음을 정리. 8개 점검 화면(`/ /stocks /stock/005930 /disclosures /backtest /status /guide/metrics /guide/metrics/changelog`)에서 모바일 터치/넘침·배지 톤·문구(데이터 기준/산식/제한) 드리프트·다음 단계 링크·중복 카피를 손봄. 점수/데이터 생성 로직·레이아웃 구조 무변경, 비자문 톤 유지. branch `ai-center/task-20-ornscore-qa` @ `980758c`(클린)에서 시작.
- **미리보기 기준**: 사용자 확인 화면은 **http://127.0.0.1:3000**, 리뷰 기준은 **이 브랜치(`ai-center/task-20-ornscore-qa`)**. 외부 공개 주소(valuemap.kr) 갱신·릴리스는 **이번 범위 아님**(다음 작업으로 남김). 로컬에서 `npm run build`로 `.next`를 재생성했으므로, 운영자가 3000 미리보기를 `next start`로 돌리고 있었다면 **재기동 권장**(stale 청크 400 회피, PROGRESS 하단 Repair 노트 참고).
- 변경 파일(10개, surgical Tailwind/문구만):
  - 데이터 드리프트(단일 소스화): `guide/metrics/page.tsx`(밸류 한계 설명 `전체 138개 종목 풀` → `${dataMetadata.count}`), `backtest/page.tsx`(사용 데이터/벤치마크 `138개 종목`·`138종목` 2곳 → `${realStockPool.length}`). 산식 버전/기준일 표기는 이미 전부 `dataStatus` 파생이라 무변경(verify_metrics 버전 게이트 0불일치 재확인).
  - 배지 톤 일관화: `StocksExplorer.tsx` 헤더 ad-hoc 상태 pill(amber/emerald 수동) → 공유 `DataStatusBadge`(`@/components/trust/badges`, 라벨도 앱 공통 `갱신 지연`/`데이터 정상`·delayed=orange). `DisclosureExplorer.tsx`의 ad-hoc amber `일부 결과 · 최신 200건` 배지·안내문 → **limited=slate**(차분, 경고색 아님)로 통일해 `/disclosures` 헤더 `제한 수집`(slate)과 톤 맞춤. `home/HomeHero.tsx` 상태 점/텍스트 amber·green → 앱 공통 orange(지연)·emerald(정상)로 색 통일.
  - 모바일 터치 타깃: `home/StockCandidateCard.tsx`(종목 보기 `min-h-[40px]`→`44px`), `home/DisclosureSignalCard.tsx`(종목 보기/DART 버튼 `min-h-[44px] inline-flex items-center` 추가), `DisclosureExplorer.tsx`(기간 칩 `py-1`→`py-1.5`), `StocksExplorer.tsx`(조건 저장/알림 칩 `py-1`→`py-1.5`). 조밀한 필터 칩 군집은 44px 강제 시 레이아웃 왜곡이라 중간값으로 개선.
  - 다음 단계 CTA: 막다른 사이드 화면에 1줄 nav 추가 — `/backtest`(준비중·실데이터 두 분기)·`/status`에 `지표 계산 방식 보기 → (/guide/metrics)` + (백테스트)`데이터 상태 확인 →`·(상태)`산식 변경 이력 →`. 메인 흐름(홈→/stocks→상세→가이드)은 이미 연결돼 무변경.
  - 중복 카피 정리: `stock/PriorityScoreCard.tsx`의 `매수·매도 추천이 아닌 탐색 우선순위입니다.` 1줄 제거 — 바로 아래 `StockConclusionHero` 하단 고지 박스가 동일 문구를 표기(같은 화면 100px 내 중복). 필수 고지 라인은 보존(히어로 박스에 유지).
- 카피 안전: 신규/변경 사용자 노출 문자열 비자문만(갱신 지연·데이터 정상·일부 결과·지표 계산 방식 보기·데이터 상태 확인 등). 추천/매수/매도/수익 보장 톤 0. verify_metrics 금칙어 게이트 0건.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·산식 버전 0불일치, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0, `/stocks` 12.2 kB·`/disclosures` 9.54 kB) · 로컬 prod(127.0.0.1:3100, 내 PID(10808)만 taskkill, 4310 AI Dev Center·3000 미리보기 무중단) 8개 점검 라우트 전부 200·에러 마커 0. SSR grep 확인: /backtest `138개 종목`+신규 nav, /status 신규 nav, /guide/metrics `전체 138개 종목 풀`, /stocks `갱신 지연`(현재 지연 상태)·`데이터 정상` 공유 배지, /disclosures `제한 수집` 렌더.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl+SSR grep+build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 360~390px에서 후보/공시 카드 버튼 44px·기간 칩 탭, /stocks·홈 상태 배지 색(주황/에메랄드)·/disclosures 제한 배지 slate, /backtest·/status 하단 nav 줄바꿈, 종목 상세 고지 1줄(중복 제거) 확인.
- 잔여 리스크/결정: (1) 조밀 필터 칩은 44px 미만(py-1.5≈30px) — 칩 군집 시각 보존 위해 의도적 중간값. (2) `/backtest`의 두 긴 주의 문단(상단 요약 + 하단 방법론)은 역할이 달라 보존, 일부 어구(편도 0.3%·슬리피지) 중복은 잔존 — 필수 고지 삭제 리스크 회피 우선. (3) 클라이언트 컴포넌트(StocksExplorer/DisclosureExplorer)는 번들 비대화 회피 위해 `dataStatus` 직접 import 대신 props/리터럴 유지(제한 문구 `최신 200건`은 의미 동일). (4) 외부 공개 주소(valuemap.kr) 미갱신 — 의도된 범위 외.
- 다음 추천 작업: (a) **외부 공개 주소 갱신/릴리스 절차**(이번 보류분) — main 머지·Vercel 배포 후 valuemap.kr 확인. (b) DisclosureExplorer/StocksExplorer 제한 문구를 서버 props로 주입해 완전 단일 소스화. (c) Playwright 도입 시 360/390px 모바일 게이트 자동화. (d) 설계서 §23 3차 OrnScore 본작업(데이터 상태 자동검증 강화·CI 산식 버전 단언·백테스트 생존편향 실해결) 재개.

## 2026-06-24 · 데이터 신뢰 레이어 Phase 2 — 공시/백테스트/상태/산식 이력 확장 (Task 18, Claude)
- 목표: 설계서 `ornscore_data_trust_badge_spec_v1.md` 2차/3차 범위(§10.4·§10.5·§12·§13·§17.1). Task 17의 전역 `dataStatus` 단일 소스를 공시 제한 배지·백테스트 한계 배지·`/status` 분리 상태·산식 변경 이력·빌드 타임 버전 단언까지 확장. 투자 추천/매수 유도 카피 0(비자문 톤 유지). branch `ai-center/task-18-ornscore-phase-2` @ `87b606c`(클린)에서 시작.
- 변경/신규 파일:
  - `src/lib/dataStatus.ts`: ⭐ `domainStatuses`(가격/재무/공시/산식 4종, 각 `{key,label,status,statusLabel,meaning,detail}`) 추가 + `dataStatus.domainStatuses`로 노출. **실판정**: 재무는 `realStockPool`에서 PER/PBR 결측(0/비숫자) 종목 비율 > 3%면 `partial` 아니면 `normal`(현재 결측 1/138=0.7% → `normal`, detail에 결측 종목수 표기), 가격은 전역 `status`(stale→`delayed`) 재사용, 공시는 항상 `limited`(최신 200건), 산식은 `metricsVersion` 메타 유무로 `normal`/`error`. `EXPECTED_METRICS_VERSION="2.4"`·`metricsChangelogPath="/guide/metrics/changelog"` 상수 export(스펙 예시 날짜 하드코딩 안 함).
  - `src/app/disclosures/page.tsx`: 헤더에 `제한 수집` `DataStatusBadge`(limited 톤) + 필터 근처 `<details>` 접근 가능 보조설명(`dataStatus.limits.disclosure` + 누락 가능성). 서버 렌더 유지, 모바일 wrap.
  - ⭐ `src/components/BacktestLimitBadges.tsx`: 한계 배지 4종(`아이디어 검증용·현재 종합점수 검증 아님·생존편향 가능·슬리피지 단순화`) 차분한 slate pill, flex-wrap(모바일 2×2). 성과/수익/추천 표현 없음. `/backtest`(준비중 분기)·`BacktestClient`(실데이터 분기 헤더) **양쪽**에 배치(기존 긴 주의 문구 보존).
  - `src/app/status/page.tsx`: 기존 스냅샷 그리드 아래 `데이터 종류별 상태` 섹션 신설 — `dataStatus.domainStatuses`를 4행으로 매핑(`DataStatusBadge` 색+단어, 모바일 1열 스택). 기존 데이터 소스 리스트 보존, 가격은 `갱신 지연` 정직 유지(2026.06.16 staleness 미은폐), `/guide/metrics/changelog` 링크 추가. 신선도 재계산 안 함(단일 소스).
  - ⭐ `src/app/guide/metrics/changelog/page.tsx`: 산식 변경 이력 스켈레톤(서버, metadata, `← 지표 가이드로`). 현재 `Metrics 2.4`·적용일(`dataStatus.metricsEffectiveDate`)·변경 요약·`현재 운영` 배지·향후 변경 기록 위치 안내. 버전/적용일 전부 `dataStatus`에서 파생(하드코딩 0).
  - `src/app/guide/metrics/page.tsx`: 산식 버전 줄에 `산식 변경 이력 보기` 상호 링크 추가.
  - `src/lib/metrics.ts`: **드리프트 수정** — 주석의 `Metrics v2.3`(2곳)을 `Metrics 2.4`로 교정. 가이드가 GitHub `metrics.ts`(참조 구현)를 링크하는데 데이터/푸터는 2.4·주석은 v2.3로 어긋나던 공개 불일치(스펙 이슈1 P0). 빌드 단언이 실제로 잡아냄.
  - `scripts/verify_metrics.py`: §17.1 산식 버전 일치 단언 추가 — (a) `stocks.json metricsVersion == "2.4"`(EXPECTED_METRICS_VERSION) 단언, (b) `src/` 전체에서 하드코딩 `Metrics x.y` 토큰이 2.4와 다르면 검출(`RE_METRICS_TOKEN`). 둘 다 exit-1 경로에 합류. 기존 composite/momentum/브랜드 게이트 무변경.
- 카피 안전: 신규/변경 사용자 노출 문자열 비자문만(제한 수집·최신 200건·아이디어 검증용·생존편향 가능·산식 변경 이력 등). verify_metrics 금칙어 게이트 0건.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0·**산식 버전 일치 0건 불일치**, exit 0 — 단, 1차 실행에서 metrics.ts v2.3 드리프트 2건 검출→교정 후 통과) · `npm run build`(타입게이트·138p 프리렌더, `/guide/metrics/changelog` 신규 라우트 추가, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /disclosures /backtest /status /guide/metrics /guide/metrics/changelog /stock/005930` 전부 200. SSR grep: /disclosures `제한 수집`+`수집 범위 안내`, /backtest 4배지 전수, /status `데이터 종류별 상태`+가격(갱신 지연)·재무(데이터 정상·결측 detail)·공시(제한 수집)·산식(데이터 정상)·`산식 변경 이력` 링크, /guide/metrics/changelog `Metrics 2.4`·`현재 운영`, /guide/metrics `산식 변경 이력 보기` 링크 모두 렌더.
- 잔여 리스크: (1) 백테스트 배지는 두 분기 모두 코드/타입 통과하나 런타임은 활성 분기(현재 실데이터 ready)만 렌더. (2) `metricsEffectiveDate`는 전용 필드 부재로 generatedAt 파생(Task 17부터 동일). (3) financial partial 임계 3% 고정값(현재 결측 0.7%라 normal) — 결측 급증 시 partial로 자동 전환. (4) 산식 버전 단언은 데이터 메타+소스 리터럴만 검사(동적 `metricsVersionLabel` 표기는 항상 일치).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — /disclosures 제한 배지·필터 details 펼침, /backtest 4배지 모바일 2×2 wrap, /status 도메인 행 모바일 1열 스택·가로 오버플로 없음, changelog 라우트.
- 다음 구체 OrnScore 태스크(설계서 §23 3차): (a) 데이터 상태 자동 검증 로직 강화(공시 200건 도달 시 limited 실판정·최근 오류 로그 요약), (b) 산식 버전 불일치 배포 차단을 CI(GitHub Actions)에도 연결, (c) 결측률/지연 상태 사용자 공개 범위 조정 + 관리자용 경고, (d) 백테스트 생존편향 실해결(시점별 유니버스 재구성).

## 2026-06-24 · Repair · Task 17 신뢰 모달 포커스 가로채기 수정 (WCAG 포커스 순서, Claude)
- Blocker(리뷰 FAIL): `DataTrustModal`의 포커스 복귀 effect가 **초기 마운트에서도 실행**되어 모든 페이지 로드 때마다 헤더 트리거("데이터 기준 보기")로 키보드 포커스를 가로챔. `open` 초기값이 `false`이므로 `useEffect(() => { if (!open) triggerRef.current?.focus?.() }, [open])`가 마운트 시 `!open === true`로 즉시 발화 → DataTrustBar가 헤더/레이아웃에 전역 배치돼 앱 전체 영향(WCAG 2.4.3 포커스 순서 위반).
- Fix(`src/components/trust/TrustLayer.tsx`): 별도 포커스-복귀 effect 제거하고 복귀 로직을 **open effect의 cleanup으로 이동**. cleanup은 open이 true→false로 바뀔 때(또는 언마운트 시)에만 실행되므로 초기 마운트에서는 절대 발화하지 않음. 열릴 때 닫기 버튼 포커스 / 닫힐 때 트리거 복귀 동작은 동일 보존. 제거된 `eslint-disable react-hooks/exhaustive-deps`도 불필요(통합 effect deps `[open]` 완전 — 나머지는 stable ref/setState).
- Passed: `npx tsc --noEmit` exit 0. 동작 분석: 마운트(open=false)→effect early-return, cleanup 미등록 → 포커스 미탈취 / open false→true→닫기버튼 포커스 / true→false→cleanup이 트리거 복귀. 기능·문구·레이아웃 무변경(effect 2개→1개 통합, 순수 동작 수정).
- 잔여: lint는 프로젝트 ESLint 비대화식 미구성(next lint 설정 프롬프트)로 미실행 — tsc가 유효 게이트. Playwright 미구성으로 AI Center 브라우저 게이트는 운영자 확인 권장(모달 열기/ESC, 출처 배지 클릭).
- 다음 구체 OrnScore 태스크(불변): Phase 2 — (a) `/disclosures` `제한 수집` 배지, (b) `/backtest` 한계 배지 4종, (c) `/status` 섹션 확장 + `/guide/metrics/changelog` 스켈레톤, (d) 빌드 타임 산식 버전 일치 단언 + partial/limited/error 상태 실판정.

## 2026-06-24 · 데이터 신뢰 레이어 1차 — 전역 DataStatus + 신뢰 배지/모달 (Task 17, Claude · 4단계/Phase 1)
- 목표: 설계서 `ornscore_data_trust_badge_spec_v1.md` 1차 범위(§23 1차 개발). 전 페이지에 흩어진 데이터 기준일·산식 버전·데이터 상태·출처·제한·투자 고지를 **단일 `dataStatus` 소스 + 재사용 신뢰 배지**로 통합. Task 14(홈)·15(종목 상세)·16(/stocks) 완료본 위에서 시작(branch `ai-center/task-17-ornscore-1` @ `5112c14`, 클린 확인).
- 신규 파일:
  - ⭐ `src/lib/dataStatus.ts` — 전역 신뢰 단일 소스. `dataMetadata`(stocks.json)에서 파생: `globalAsOfDate`(20260616)·`globalAsOfLabel`(formatBizDateLong)·`marketDateLabel`(모바일 압축)·`status`(isDataStale→normal/delayed, partial/limited/error는 타입·메타 예약)·`statusLabel`/`statusMeaning`/`statusTone`·`universeCount`(138)·`metricsVersion`(2.4)·`metricsVersionLabel`(**단일 표기 "Metrics 2.4"**)·`metricsEffectiveDate`(전용 필드 부재 → generatedAt 날짜 파생 "2026.06.16")·`sources`(KRX/Naver Finance/yfinance/DART 사용목적 §9)·`notices`(투자/점수 비자문 고지)·`limits`(공시 200건·백테스트). 스펙 예시 날짜 하드코딩 안 함(실값만).
  - ⭐ `src/components/trust/badges.tsx` — 순수 프레젠테이션 프리미티브: `DataStatusBadge`(● + 상태 단어, 색상 외 단어 항상 노출 §20)·`AsOfDateBadge`·`MetricsVersionBadge`. 상태 톤 5색(normal emerald / partial yellow / delayed orange / limited slate / error red).
  - ⭐ `src/components/trust/TrustLayer.tsx`("use client") — `DataSourceBadges`(출처 배지: 클릭/포커스 토글 상세, hover 의존 금지, aria-expanded/describedby)·`DataTrustModal`(트리거 버튼 "데이터 기준 보기" → 다이얼로그: 기준일·출처·산식·상태·제한·투자 고지, ESC/닫기/백드롭, 열릴 때 닫기 버튼 포커스·닫힐 때 트리거 복귀)·`DataTrustBar`(데스크톱 전체 / 모바일 압축 1줄 + 트리거). 서버가 `dataStatus`를 직렬화 props로 주입(클라이언트가 stocks.json 미번들).
- 통합(전 화면 단일 소스 참조):
  - `src/components/AppHeader.tsx`: 기존 서브바(둘째 줄) 우측에 `MetricsVersionBadge`(sm+) + `DataTrustModal` 트리거 추가. 기존 날짜/신선도 표시·KRX·Naver 텍스트·WelcomeToast 보존, 둘째 바 신설 안 함(`sm:hidden`/`hidden sm:inline` 반응형 유지).
  - `src/app/layout.tsx` 푸터: 날짜·산식·상태를 전부 `dataStatus`로 교체("데이터 {globalAsOfLabel} 장마감 · 산식 Metrics 2.4 · 데이터 상태 …"). realStocks 직접 import 제거.
  - `src/app/guide/metrics/page.tsx`: **`Metrics v{ver}` → `metricsVersionLabel`("Metrics 2.4")로 stray `v` 제거** + 적용일 표기. (스펙 §3.2/이슈1 P0 해소.)
  - `src/app/status/page.tsx` 스냅샷 산식 버전: `metricsVersionLabel`.
  - `src/components/stock/PriorityScoreCard.tsx` + `src/app/stock/[ticker]/page.tsx`: 점수 카드 칩·데이터 기준 블록 산식 버전을 `metricsVersionLabel`로 통일(칩의 "산식 " 중복 접두 제거 → "Metrics 2.4").
  - `/stocks`(StocksExplorer)는 이미 "Metrics {ver}" = "Metrics 2.4" 렌더 → 무변경(일치 확인).
- 카피 안전: 신규/변경 파일 비자문(기준일·출처·산식·상태·제한·non-advice)만. 금칙어 grep 0(추천 종목/매수 후보/상승 가능성/급등 예상 등). 투자 고지는 설계서 §21 지정 부정문만.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /stock/005930 /guide/metrics /status` 전부 200·에러 마커 0, **5라우트 모두 "Metrics 2.4" 노출·"Metrics v" 0건·as-of 2026.06.16 일치**, 헤더 "데이터 기준 보기" 트리거·출처 사용목적(PER·PBR·ROE·배당) SSR 렌더, 푸터 "산식 Metrics 2.4" 렌더.
- 중요 관찰: 실데이터가 기준일(20260616)로부터 6영업일 경과 → `dataStatus.status = "delayed"`("갱신 지연"). 따라서 헤더(amber)·푸터("갱신 지연 확인")·모달·`/status`("갱신 지연 가능")가 **모두 동일하게 지연 상태 정직 표기**(스펙 예시의 "정상"은 당일 데이터 가정). 상태 시스템이 의도대로 단일 소스에서 일관 동작함을 입증.
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 게이트 로컬 미가용. curl+SSR grep+build 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000) 권장** — 모달 클릭 열기/ESC·닫기, 출처 배지 클릭 툴팁, 모바일 압축 1줄·오버플로 없음(`/ /stocks /stock/005930 /guide/metrics /status`).
- 잔여 리스크: (1) status는 Phase-1에서 normal/delayed만 계산(partial/limited/error는 타입·메타만 예약, 정적). (2) metricsEffectiveDate는 전용 필드 부재로 generatedAt 날짜 파생(스펙 §8의 전용 적용일 필드 없음). (3) Nice-to-have 미착수(아래 다음 태스크).
- 다음 구체 OrnScore 태스크(설계서 §23 2차/3차 · Phase 2): (a) `/disclosures` 헤더 `제한 수집` 배지 + 기간 필터 툴팁, (b) `/backtest` 상단 한계 배지 4종(아이디어 검증용·현재 종합점수 검증 아님·생존편향 가능·슬리피지 단순화), (c) `/status` 섹션 확장(가격/재무/공시/산식 분리 상태) + `/guide/metrics/changelog` 스켈레톤, (d) 빌드 타임 산식 버전 일치 단언(§17.1) 및 partial/limited/error 상태 실판정(재무 결측률·공시 200건 도달).

## 2026-06-24 · 종목 탐색 필터 UI 1차 — 질문형 탐색 보드 (Task 16, Claude)
- 목표: 설계서 `ornscore_stock_filter_ui_spec_v1.md` 1차 범위(§24). `/stocks`를 '단순 필터/정렬 화면'에서 '질문형 주식 탐색 보드'로 개편 — 첫 화면 3초 안에 "질문을 누르면 오늘 확인할 종목이 자동으로 좁혀지는 화면" 가치 전달. 비자문 톤 유지(확인 후보/먼저 볼 종목/급등 사유 확인 톤, 추천·매수 언어 금지).
- 변경 파일:
  - `src/app/stocks/page.tsx`: `dataMetadata·formatBizDateLong·isDataStale` import, 종목별 `r3m`(returns.r3m) 추가, `StocksExplorer`에 `totalCount·asOf·metricsVersion·dataStale` props 전달. 계산은 전부 서버사이드 유지, plain props. `?theme=` 딥링크·`revalidate=3600`·`generateMetadata` 보존.
  - `src/lib/savedSearches.ts`: `SavedSearchConfig`에 `momentumMin/flowMin/valueMin/volMin?` 추가(저장/알림 config가 새 점수-min 필드 보존, jsonb 저장이라 마이그레이션 불필요).
  - `src/components/StocksExplorer.tsx`(대규모 개편, 전부 보존+추가):
    1) 헤더: 제목 `오늘 확인할 종목 찾기`·본문·`조건 충족 N / 전체 {total}`·`{asOf} 장마감 · Metrics {ver} · 데이터 정상/지연` 배지·상시 `투자 추천 아님 · 탐색 도구` 고지.
    2) 질문형 프리셋 8종을 **카드 UI**로 격상(섹션 `어떤 종목을 찾고 있나요?` + 보조문구, 데스크톱 3열/모바일 1열 스택). 카드 = 심볼·제목·설명·조건 배지(config에서 도출)·예상 결과 수(전체 풀 독립 계산)·선택 상태(`aria-pressed`·✓·블루). 기존 5종 config 보존 + 신규 3종(밸류+추세 동시 value70·momentum70·vol50 / 최근 흐름 강한 momentum80+주의 / 급등했지만 위험한 r3m desc+주의). 클릭=적용, 재클릭=해제(toggle).
    3) 빠른 프리셋 칩(보조)을 설계서 11종으로 확장(저평가/추세 강세/저PBR/밸류+추세/균형 종목/ROE 우수/배당 있음/대형주/소형주/급등 위험/거래 급증), 단일 선택·선택 강조(✓). 질문 카드와 시각 구분(칩 vs 카드).
    4) **현재 적용 조건 요약 바**(결과 바로 위, 상시): 조건 태그(activeChips 재사용)·`조건 충족 N / 전체 M`·자연어 설명(`describeConditions()` — 필터없음/테마/질문형/상세 4상태)·`조건 저장`/`이 조건 알림`/`초기화`(초기화는 §16대로 confirm). 기존 별도 칩 행은 요약 바로 통합(중복 제거).
    5) 정렬 `<optgroup>` 3그룹화(ORNSCORE 점수 5종+거래활성도 / 재무 5종 / 움직임·위험 r3m). 변동성·낙폭 정렬은 필드 미전달이라 다음 태스크로 명시.
    6) 결과 카드 = '탐색 후보 카드': insights 혼합 블록을 `✓ 강점`(emerald, 점수≥70)·`⚠ 주의`(amber, 점수<40·가격 하락 중·r3m≥50 급등 주의) 두 그룹으로 분리(색+아이콘+텍스트). 종목명/코드/시장/가격/등락/시총/종합·4지표/핵심 재무/테마·`/stock/{ticker}` Link prefetch=false 보존.
    7) 결과 없음 강화: 제목 `조건에 맞는 종목이 없습니다.`+본문+`조건 완화하기`/`전체 종목 보기`(둘 다 resetFilters).
    8) 상세 필터: 기본 접힘 유지(데스크톱 아코디언/모바일 바텀시트), ORNSCORE 지표 슬라이더(종합+추세/거래활성도/밸류/위험조정) 추가로 새 min 조정 가능. 기존 컨트롤 0 제거.
- 순수 로직 분리: `matchesConfig(stock, FilterConfig)`(기존 filtered와 동일 의미, 새 min은 0이면 비제약)·`presetToConfig`·`presetCounts`(전체 풀 독립 카운트, count-vs-full-pool 주석). 기본 `/stocks` 결과셋은 default config(PER 200·PBR 30 상한, 나머지 0)에서 기존과 동일.
- 카피 안전: 신규/변경 파일 금칙어 13종 grep 0(급등할 종목/사야 할 종목/추천 종목/매수 후보/상승 가능성/급등 예상/수익 기대/매수 적기/투자 매력도 등). 위험 질문(최근 흐름·급등 위험)은 `급등 사유 확인 필요` 톤만.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0, `/stocks` 11.8 kB) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /stocks /today /disclosures /stock/005930` 200·에러 마커 0, `/stocks` SSR에 신규 카피(제목·`어떤 종목을 찾고 있나요`·`현재 조건`·`투자 추천 아님`·`급등했지만 위험한 종목`·`밸류 + 추세 동시`·`강점`·`주의`·`ORNSCORE 점수` optgroup) 렌더. `?theme=2차전지`(URL 인코딩) 200·테마칩·테마 describe 문장 렌더(딥링크 보존).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl smoke + SSR grep + build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000, `/stocks` 포함) 실행 권장** — 질문 카드 그리드·선택 상태·요약 바·강점/주의 분리·정렬 그룹·모바일 1열 스택·터치 타겟 확인.
- 잔여 리스크/결정: (1) `/stocks`는 클라 컴포넌트라 초기 상태는 SSR, 인터랙션은 CSR. (2) presetCounts는 '그 프리셋만 적용 시 N개'(현재 활성 필터와 무관) — 의미를 카드에 '예상 결과'로 표기. (3) 빠른 칩은 이번 패스 단일 선택(설계서 §9 다중 AND는 다음 태스크). (4) 변동성·낙폭 정렬은 필드 미전달로 보류.
- 다음 구체 OrnScore 태스크(설계서 §24 2차): (a) 탐색 모드 탭(질문/지표/직접) + 보기 방식(카드/표/압축) 추가, (b) 빠른 칩 다중 선택 AND + 칩 변경 시 실시간 예상 결과 수, (c) 결과 없음 자동 완화 제안(예: 밸류 80+→70+로 N개 추가), (d) 변동성·낙폭 정렬용 volStats 필드(annualStd·maxDrawdown)를 page.tsx에서 전달.

## 2026-06-24 · 종목 상세 결론 카드 1차 (Task 15, Claude)
- 목표: 설계서 `ornscore_stock_detail_conclusion_card_spec_v1.md` 1차 범위. 종목 상세 상단을 '정보 나열'에서 '결론 카드'로 개편 — 첫 화면 10초 안에 ①이 종목은 어떤 성격의 후보인가 ②왜 우선 확인 후보인가 ③다음에 무엇을 확인할까 에 답. 비자문 언어 유지(추천/미래가격 금지, 확인/우선/급등 사유 확인 톤).
- 신규 컴포넌트(전부 서버·순수 프레젠테이션, Write로 UTF-8/noBOM/LF 작성):
  - `src/components/stock/StockConclusionHero.tsx` — 상단 결론 카드 컴포저. 모바일 순서: 종목명/현재가 → 탐색 우선도 → 현재 결론 → 강점/주의 → 다음 확인 → 고지. 위험 경고(급등/과열)는 점수 카드와 분리된 별도 바.
  - `StockHeader.tsx`(업종 태그·종목명 최대·코드 + LivePrice/관심·비교·공유 슬롯 + 기준일 장마감 라벨), `PriorityScoreCard.tsx`(라벨 '탐색 우선도'·`N / 100`·전체/업종 순위·필수데이터%·이상값 점검·산식 버전·'매수·매도 추천이 아닌 탐색 우선순위' 고지·인디고+중립 팔레트), `ConclusionSummaryCard.tsx`(제목 '현재 결론'·유형+요약+주의점), `StrengthWarningPanel.tsx`(강점 emerald / 주의 amber, md 2열·모바일 스택, '확인 필요' 톤), `NextActionButtons.tsx`(공시로 이유 확인 #disclosures / 재무로 실적 확인 #financials / 점수 계산 근거 #basis / 업종 내 위치 보기 #summary, min-h-44px).
  - `src/lib/conclusion.ts` — `classifyConclusion({momentum,flow,value,vol,surge3m})` 순수 함수. 설계서 §6.3 표를 보수적 우선순위로 매핑(균형형/저평가+추세/시장 관심 급증/과열 주의/저평가 대기/단기 이슈 확인/변동성 주의). summary는 강점·약점만 기술(방향 예측 금지), riskNote는 확인 톤. 강점>=70·주의<50으로 페이지 기존 convention과 일치.
- `src/app/stock/[ticker]/page.tsx`: 기존 `<header>`+'결론 헤드라인' 섹션을 `<StockConclusionHero .../>`로 교체. 이미 계산된 값(composite·reason·ranks·completeness·surge3m·dataWarnings·mySector·priceAsOf·metricsVersion) 재사용. 강화 고지 2줄('매수·매도 추천이 아닌 탐색 우선순위'+'향후 수익률을 의미하지 않습니다') 노출. 죽은 코드 정리(scoreTone/tone/grade/gradeOf 제거 — 구 헤드라인 전용). RecentViewTracker·breadcrumb·JSON-LD·StockTabs(요약/재무/공시/점수 근거)·generateStaticParams·revalidate 전부 보존. isSuspect(dataWarnings) 임시 점수 회색+고지·Top제외 의미 보존.
- 설계 결정/잔여: (1) 업종 비교 전용 탭 부재 → '업종 내 위치 보기'는 같은 업종 비교 섹션이 든 요약 탭(#summary) 연결, 2차에서 전용 탭+스무스 스크롤. (2) Nice-to-have(레벨드 RiskAlertCard 완전분리·4지표 미니바·초보자 체크리스트 상단)는 광범위 리팩터 회피 위해 보류 — 단, 급등≥80/과열≥50 위험 바 + 강점/주의 패널로 '점수-위험 분리·강점/주의 시각 분리' 완료 기준은 충족, 초보자 체크리스트는 기존 BeginnerReading(요약 탭)에 존재.
- 카피 안전: 신규/변경 파일 금칙어 13종(지금 살 만한·상승 가능성·매수 적기·저점 기회·목표가·수익 예상·추천 종목·매수 후보·투자 매력도·급등 예상·수익 기대 등) grep 0.
- 검증: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3100, 내 PID만 taskkill, 4310 AI Dev Center 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 마커 0. 종목상세 SSR HTML에 탐색 우선도/현재 결론/강점/주의/4개 다음확인 버튼 라벨/2줄 고지 렌더, 히어로가 '자체 지표 4종' 차트보다 먼저(offset 20557 < 41128).
- 게이트 한계: Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl smoke + SSR grep + build로 대체. **운영자: AI Center 브라우저 체크(http://127.0.0.1:3000, 종목 상세 라우트 포함) 실행 권장**.
- 위험/한계: 다음확인 앵커(#disclosures 등)는 StockTabs의 클라 hashchange로 탭 전환 — SSR엔 요약 탭만, 앵커 라벨은 빌드 청크/DOM에 존재. 업종 비교 전용 탭은 미구현(요약 탭 대체).
- 다음 구체 태스크(Phase 2, 설계서 §17 2차 개발): (a) 레벨드 RiskAlertCard 완전 분리(변동성·낙폭 단계), (b) 4지표 미니바 히어로 추가(요약 탭 MetricStrip 중복 없이 단일 소스), (c) 업종 비교 전용 탭 신설 + 다음확인 버튼 스무스 스크롤/탭 전환 인터랙션.

## 2026-06-24 · 홈 첫 화면 개편 1차 — 탐색 대시보드 (Task 14, Claude)
- 목표: 설계서 `ornscore_home_redesign_spec_v1.md` 1차 범위. 홈을 '서비스 소개'에서 '오늘의 투자 탐색 대시보드'로 전환. 첫 화면 3초 안에 "오늘 볼 종목을 138개에서 5개로 줄여주는 한국 주식 탐색 보드" 가치 전달. 비자문 언어 유지(추천 종목/매수 후보/상승 가능성/급등 예상/수익 기대 금지).
- 신규 컴포넌트(전부 서버 컴포넌트, 순수 프레젠테이션, python으로 UTF-8 작성 — OneDrive 한글깨짐 회피):
  - `src/components/home/HomeHero.tsx` — 메인/서브 카피(설계서 §15 그대로) + CTA 3종(`오늘의 후보 보기`#today-candidates 앵커 / `종목 직접 찾기`/stocks / `지표 계산 방식 보기`/guide/metrics) + 베타·기준일·정상/지연 pill + 우측 미니 대시보드(종합80+/거래활성도급증/공시신호/상승·하락).
  - `src/components/home/MarketSnapshotCards.tsx` — 4카드(분석종목·종합80+후보·거래활성도급증·공시신호), 데스크톱 4열/모바일 2열.
  - `src/components/home/TopCandidateSection.tsx` + `StockCandidateCard.tsx` — 상위 5 후보(순위·종목명·코드·현재가·3개월등락·종합/100·강점지표2개·주의문구·종목보기 CTA). 빈 데이터 graceful fallback.
  - `src/components/home/DisclosureSignalSection.tsx` + `DisclosureSignalCard.tsx` — 상위 3 공시(유형태그·종목·제목·날짜·확인포인트·종목보기/DART원문). 호재/악재 숫자 미표시 + 분류 신뢰도 고지.
  - `src/components/home/HowItWorksSection.tsx`(3단계) + `RiskNotice.tsx`(투자추천아님/과거데이터/사용자책임, 모바일에서도 항상 노출).
  - `src/lib/homeSnapshot.ts` — `volumeSpikeCount` 파생 헬퍼.
- `src/app/page.tsx` 재작성: 데이터 패칭·계산 전부 서버사이드 유지(단일 데이터 소스·SSR 경계). 뷰모델(candidates/signalVMs)을 서버에서 만들어 plain props로 전달. WelcomeOnboarding·metadata·`revalidate=3600`·푸터(데이터 출처/약관) 보존.
- 설계 결정(중요):
  1) **volumeSpikeCount는 파생 추정값**: 전용 데이터 없어 `flowStats.ratio>=1.5`(최근5일/20일 거래대금), ratio 결측 시 `flow>=75` 폴백. 상수·주석으로 교체 용이하게 격리. → Phase-2에서 실제 거래량 급증 소스로 교체.
  2) **공시 분류 신뢰도 숫자 미표시**: `strength`는 신호 유형별 하드코딩 상수(진짜 per-공시 분류 신뢰도 아님)라 숫자 날조 대신 고지 문구만 노출. note 필드(호재/악재 표현 섞임)는 렌더 안 하고 유형별 중립 '확인 포인트'로 대체.
  3) **콘텐츠 최대폭은 기존 셸 `max-w-5xl` 유지**(설계서 1180px는 앱 셸과 충돌 → 새 폭 강제 안 함). 기존 레이아웃 래퍼(`src/app/layout.tsx`) 그대로 사용.
  4) **스냅샷 카드 딥링크**: `/stocks`는 `?theme=`만 지원(점수80 필터·거래활성도 정렬 URL 파라미터 없음) → 일반 `/stocks`·`/disclosures`로 연결, 딥링크는 Phase-2 후속.
  5) strongCount는 후보 리스트와 동일한 `!isSuspect` 필터로 내부 일관(스냅샷↔후보 카운트 불일치 방지).
- 카피 안전: 신규 파일 금칙어 0(`추천 종목|매수 후보|상승 가능성|급등 예상|수익 기대|매수 기회|호재 확정|악재 확정|안전한 종목` grep 0). '매수 추천'은 설계서 지정 부정문("매수 추천이 아니라")에서만 등장.
- 검증: `npx tsc --noEmit` exit 0 · `python scripts/verify_metrics.py`(PYTHONUTF8=1, 138종목 0오류·금칙어 0, exit 0) · `npm run build`(타입게이트·138p 프리렌더, exit 0) · 로컬 prod(127.0.0.1:3000, 내 PID만 종료) `/ /today /stocks /disclosures /stock/005930` 200·에러 마커 0, 홈 SSR에 신규 카피(`오늘 볼 종목`·`오늘의 시장 스냅샷`·`오늘 추가 확인 후보`·`분류 신뢰도`·`거래활성도 급증`·CTA 3종) 렌더, 후보 카드 5개·공시 카드 3개 확인.
- 게이트 한계: 이 저장소엔 Playwright 미구성 → AI Center DESKTOP/MOBILE 브라우저 게이트 로컬 미가용. curl smoke + SSR HTML 콘텐츠 grep으로 대체. **AI Center 브라우저 체크(http://127.0.0.1:3000) 운영자 실행 권장** — 히어로/4스냅샷/5후보/3공시(호재악재 미표시)/CTA/고지/모바일 가로 오버플로 확인.
- 위험/한계: (a) volumeSpikeCount는 프록시(실 거래량 급증 데이터 아님). (b) 공시 per-건 분류 신뢰도 실값 부재(고지로 대체). (c) 후보 강점지표는 4지표 상위2 단순 추출. (d) DART 원문/공시 enrich 수치는 운영자가 DART 키로 `fetch_*_details.py` 실행 시에만 노출(graceful no-op).
- 다음 구체 태스크(Phase 2): (a) 후보 카드 hover 인터랙션. (b) `/stocks`에 score80 필터·거래활성도 정렬 URL 파라미터 추가 후 스냅샷 카드 딥링크 연결. (c) 실제 거래량 급증 데이터 소스 → homeSnapshot 교체. (d) 데이터 상태 배지 전역 통일.

## 2026-06-24 · Pass 12 · 종목별 StockDisclosures 수집 기준 신선도 라벨 (Task 36, Claude)
- 목표: Pass 11이 /disclosures(시장 전체 explorer)에 붙인 '수집 기준 · {KST} · {출처}' 신선도 라벨을, Pass 11·Repair 패스가 '다음 로컬 태스크 (a)'로 carry해 온 대로 **종목 상세의 종목별 공시 카드(StockDisclosures)** 헤더에도 동일 적용. 사용자가 종목 상세에서 보는 공시 묶음이 언제·어디서(실시간/저장본/예시 표본) 수집됐는지 1줄로 표기. 투자 로직·점수·신호강도·분류 전부 무변경(순수 additive UI/payload).
- 변경 파일/내용:
  - `src/app/api/disclosures/[ticker]/route.ts`: live payload(`source:"live"`)에 `fetchedAt: new Date().toISOString()` 추가, catch의 sample 폴백 `NextResponse.json` 반환에도 `fetchedAt` 추가. cache 분기는 저장된 payload를 `...spread` 하므로 fetchedAt를 자동 carry(원수집 시각 보존). `detectSignals`·`enrichCorrection→…→enrichInsider` 합성 체인·scoring·count 전부 무변경. recent/route.ts(Pass 11에서 처리)와 동일 패턴.
  - `src/components/StockDisclosures.tsx`: `ApiResponse`에 `fetchedAt?: string` 추가, `sourceKo`(SourceBadge와 동일 매핑: 실시간/저장본/예시 표본)·`fmtKST`(명시 timeZone=Asia/Seoul, NaN/undefined 가드, SSR/CSR 일관) 헬퍼를 DisclosureExplorer와 바이트 동일하게 추가, 헤더 flex 바로 아래 `text-[11px] text-zinc-500 dark:text-zinc-400` muted 라벨 1줄(`-mt-2 mb-3 tabular-nums`). 시각·출처 둘 다 없으면 null 반환(graceful), 시각만 없으면 '수집 시각 미상'. 기존 SourceBadge는 그대로 유지(라벨과 배지 출처 키 일관).
- 카피 안전: 신규 사용자 노출 문자열은 `수집 기준` + 포맷된 숫자(KST 시각)뿐 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌(0건 확인).
- 검증: `python scripts/verify_metrics.py`(PYTHONUTF8=1·PYTHONIOENCODING=utf-8) 통과(138종목 0오류 · compositeScore/모멘텀 백분위 정합 · 브랜드/금칙어 0, exit 0) / `npx tsc --noEmit` exit 0 / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더, exit 0) · 빌드 청크 grep: `수집 기준` 문자열이 신규로 `.next/static/chunks/app/stock/[ticker]/page-*.js`에 컴파일됨(기존 `app/disclosures/page-*.js`와 함께 2곳) / 로컬 prod 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단) `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/005930?days=90&limit=20` 200·error null·source=sample·**fetchedAt 존재**(신규 폴백 경로 확인)·count 4, `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재·signalCount 12. StockDisclosures 라벨은 클라 useEffect fetch라 SSR HTML엔 미존재 → 청크 문자열 존재로 컴파일 확인.
- 게이트 한계: 이 저장소엔 Playwright config/스크립트가 없어(`playwright.config.*`·tests/·e2e/ 부재, package.json에 playwright 스크립트 없음) AI Center DESKTOP/MOBILE 브라우저 게이트는 로컬 미가용 — curl smoke로 /stock/[ticker] 200·에러 마커 0(하이드레이션/404 회귀 없음)으로 대체.
- Operator-only blocker(변동 없음): DART 키 필요 fetch 스크립트(`fetch_*_details.py` → `public/data/*-signals.json`)는 로컬 미실행 → enrich 수치·실제 source=live는 키 주입 후에만 노출(현재 graceful no-op·source=sample/cache). single_contract/correction의 `⚠️ operator-verify` 정규식(`RE_AMOUNT`/`RE_RATIO`/`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`)은 실보고서 본문 대조 필요.
- Next two local tasks: (a) `src/lib/signalDetailsShared.ts`의 `toEok`/`matchRow`에 단위 수준 assertion(원→억원 반올림·빈 배열·rcept_no 매칭/폴백 경계) 추가 — Node/tsx 로컬 실행 또는 타입게이트로 검증. (b) 6개 `*Clause()` enrich 빌더가 공유하는 "parts 배열을 ` · `로 join" 패턴을 공통 빌더로 추출해 중복 축소 — 순수 리팩터, tsc/build로 검증.

## 2026-06-23 · Pass 10 공시 enrich 공통 util 추출 — 중복 축소 리팩터 (Task 33, Claude)
- 목표: Pass 9가 '다음 패스 (b)'로 남긴 "6개 enrichX lib의 lazy-load·rcept_no 매칭·원→억원 헬퍼를 단일 util로 통합해 중복 축소"를 해소. 동작·점수·신호·노출 문자열 전부 무변경(순수 내부 리팩터). 라우트 2종은 손대지 않음.
- 변경 파일/내용:
  - ⭐ `src/lib/signalDetailsShared.ts` 신설 — 5개 enrich lib이 각자 복붙하던 공통 3종을 한 곳으로: (a) `loadSignalFile<T>(filename)` — 모듈 단위 `Map<string, unknown>` 캐시로 같은 `public/data/*-signals.json`을 최대 1회만 `fs.existsSync`+try/catch로 읽고 없으면 graceful `{}` 반환(파일이 없는 경우도 캐시해 재시도 방지). (b) `matchRow<T extends {rcept_no?: string}>(rows, rceptNo)` = `rows.find(r=>r.rcept_no===rceptNo) ?? rows[0]`. (c) `toEok(won)` = `Math.round(won/1e8)`. enrichX 고유 로직(signalType 가드·note 문자열)은 util에 두지 않음.
  - `src/lib/{insider,treasury,capital,contract,correction}Details.ts` 5종 리팩터 — 각자 갖던 `let cache`/`let loaded`/`function load()`(15줄)와 `rows.find(...) ?? rows[0]`, `Math.round(x/1e8)`을 shared util 호출로 위임. 각 파일의 `import fs`/`import path` 제거(이제 shared가 담당). 각 `enrichX(...)` 시그니처·signalType 가드·strength/direction 처리·생성 note 문자열(`취득예정`/`발행규모`/`계약금액`/`직전매출 대비`/`정정 전 … → 정정 후`/`보유 …주·비율 …%`/`장내매수 확인`) **전부 바이트 동일**. `matchRow`가 `T | undefined`를 반환하므로(빈 배열 honest 타입) 각 lib에 절대 발화 안 되는 `if (!match) return signal;` 가드 1줄 추가(rows 비어있지 않음이 직전에 보장되어 런타임 무영향·출력 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — **무변경**(export된 `enrichX` 시그니처 그대로 소비).
- 카피 안전: 신규 사용자 노출 문자열 0(util 주석만 추가, note 문자열 무변경). verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·6 lib 타입 통일 확인·종목 138p 프리렌더, exit 0 — 리팩터가 컴파일·타입 정합됨을 보증하는 1차 게이트) / 공유 서버 청크 `.next/server/chunks/7381.js`에 6종 포맷(`취득예정`·`발행규모`·`계약금액`·`정정 전`·`직전매출 대비`·`장내매수 확인`) 전부 잔존 확인 / 로컬 프로덕션 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample·error null·signalCount 12)·`/005930`(source=cache·error null·signalCount 3) 200 = shared 로더가 graceful no-op 경로를 보존함 확인(로컬에 *-signals.json 없음).
- 위험/한계: 순수 리팩터라 외부 동작 변화 없음. `*-signals.json` 미존재 시 enrich 미노출은 정상 graceful no-op(이전과 동일). 운영자 전용 잔여는 그대로: DART 키로 fetch 스크립트 실행해 `*-signals.json` 생성, 단일계약·정정의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 패스(2개·구체·로컬 검증 가능): (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 검증 가능. (b) 각 lib의 `*Clause()` 빌더가 공유하는 "parts를 ` · `로 join" 패턴을 공통화하거나, `toEok`/`matchRow`에 단위 수준 assertion 추가.

## 2026-06-23 · Pass 9 공시 핵심 숫자 — 정정(correction) 본문 정정 전/후 수치 (Task 31, Claude)
- 목표: Pass 8이 '다음 패스'로 남긴 '본문 XML 스캐폴드 패턴을 correction enrich로 확장'을 해소. 단일계약(Pass 8 contractDetails)과 동일한 §18.2 document.xml 본문 파싱 + graceful 앱 경로를 정정공시에 적용. 구조화 엔드포인트가 없는 마지막 비구조화 경로(단일계약·정정) 중 정정을 메움. 투자 로직·점수·신호 강도 전부 무변경, 사실 수치만.
- 변경 파일/내용:
  - ⭐ `src/lib/correctionDetails.ts` 신설 — `contractDetails.ts` 미러. `correction-signals.json` lazy try/catch 로드(없으면 `{}` → graceful no-op). `CorrectionRow {rcept_no, field?, before?, after?, date?}`. `correctionClause()`는 before·after가 모두 유한 숫자이고 억원 반올림 후 서로 다를 때만 ` · {항목명 }정정 전 X억원 → 정정 후 Y억원` 사실 절 생성(원→억원 형제 enrich와 동일 단위, 손실 정정 대비 부호 보존, null/NaN/하이픈 방어, 동일값이면 생략). `enrichCorrection(stockCode, signal)`는 `signal.signalType==="correction"` + 매칭 행(`rcept_no` 일치, 폴백 `rows[0]`)일 때만 `signal.note`에 절 덧붙임. `strength`·`direction`·점수·타입·다른 파일 무변경. `fs`/`path` import만.
  - ⭐ `scripts/fetch_correction_details.py` 신설 — `fetch_contract_details.py` 미러(운영 전용, 로컬 미실행). `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, `RE_REPORT_NM=re.compile("정정")`, list.json으로 정정 보고서 rcept_no 수집 → `document.xml`(zip) 다운로드 → 태그 제거 평문화 → `RE_BEFORE`/`RE_AFTER`(정정 전/후 원 단위 수치, 콤마·음수 허용)·`RE_FIELD`(손익 항목명) 추출 → `public/data/correction-signals.json`(ticker → `[{rcept_no, field, before, after, date}]`). 전·후 값이 모두 있어야 행 생성(graceful skip). per-call `time.sleep(0.12)` 한도 보호. **본문 양식·정규식·zip 여부 전부 `⚠️ operator-verify`** — 정정공시는 정정사유만 서술하고 수치표가 없는 경우도 많아 실보고서 1~2건으로 확인 후 교정 필수.
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — `enrichCorrection`을 최외곽 래퍼로 추가(`enrichCorrection(code, enrichContract(code, enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))))`). recent 라우트 `!` non-null 단언·ticker 라우트 인자 형태 각각 보존. UI/컴포넌트 편집 0건(`StockDisclosures.tsx`가 이미 `signal.note` 렌더).
- 카피 안전: 신규 문자열(`정정 전 X억원 → 정정 후 Y억원`·항목명)은 숫자·항목 사실만 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더, exit 0) / 공유 서버 청크 `.next/server/chunks/7381.js`에 신규 포맷(`정정 전 ${...}억원 → 정정 후`)이 형제 절(`계약금액`·`발행규모`·`취득예정`)과 함께 존재 확인 / 로컬 프로덕션 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인(로컬에 correction-signals.json 없음).
- 위험/한계: 정정 절은 `correction-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체). 정정 본문은 양식 편차가 커 RE_BEFORE/RE_AFTER/RE_FIELD가 추정 단계 — 운영 키 실호출 검증 전엔 활성화 보류.
- 남은 블로커(운영자 전용): 송님이 DART 키로 `python scripts/fetch_correction_details.py` 실행 → `public/data/correction-signals.json` 생성 후, `⚠️ operator-verify` 정규식을 실제 정정보고서 1~2건 본문과 대조해 매핑만 교정. (구조화 엔드포인트 5종=임원·자기주식·유증·CB·BW는 enrich 경로 확보 완료, 비구조화 2종=단일계약·정정은 본문 스캐폴드 완료·정규식 운영 검증 대기.)
- 다음 패스(2개·구체·로컬 검증 가능): (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 검증 가능. (b) 6개 `enrichX` lib(insider·treasury·capital·contract·correction + 공통)의 lazy-load·원→억원 헬퍼를 단일 util로 통합해 중복 축소 — 리팩터, 타입게이트로 검증 가능.

## 2026-06-23 · Pass 8(Campaign 8) 공시 데이터 신뢰도 — BW 구조화 enrich + 단일계약 본문 XML 스캐폴드 (Task 29, Claude)
- 목표: Pass 7이 마감한 '구조화 엔드포인트 4종(임원·자기주식·유증·CB)' 위에, ① 같은 구조화 패턴으로 **신주인수권부사채(BW)** 한 종을 더 메우고(완전 구현·저위험), ② 남은 유일한 비구조화 경로인 **단일계약 본문(document.xml) 파싱**을 오프라인 스캐폴드+graceful 앱 경로로 착수. 투자 로직·점수·신호 강도 전부 무변경, 사실 숫자만.
- PRIMARY(완전 구현):
  - `src/lib/disclosure-signals.ts` — `RE_BW = /신주인수권부사채[권]?\s*발행/` 추가, `detectCapitalRaise`가 `isBw`도 수용(`kind = isRights ? "유상증자" : isCb ? "전환사채" : "신주인수권부사채"`). signalLabel은 `${kind} 발행`, strength 65 유지(다른 디텍터 무변경). RE_CB(`전환사채…`)와 RE_BW(`신주인수권부사채…`)는 서로 매칭 안 됨.
  - `scripts/fetch_capital_details.py` — `fetch_bw(key,corp,bgn,end)` 신설(`bwbdIsDecsn.json` 미러, 권면총액 `bd_fta`·자금목적 `fdpp_*` 동일 구조), 종목당 rows = 유증+CB+BW(호출 3회). `bd_fta`·행사기간(`ex_pd_bgd/edd`) 필드는 `⚠️ operator-verify` 주석. **로컬 실행 안 함**(키·원격호출 없음).
  - `src/lib/capitalDetails.ts` — 무변경. kind/amount/fundsUse에 대해 이미 일반적이라 BW 행(kind="신주인수권부사채")이 그대로 통과(재확인 완료).
  - UI 보라 배지: `StockDisclosures.tsx`(SIGNAL_BG)·`DisclosureExplorer.tsx`(SIGNAL_STYLES+SIGNAL_DESCRIPTIONS)에 `"신주인수권부사채 발행"` 보라 항목 추가(유증/CB와 동일 팔레트). 누락 시에도 zinc 폴백이라 graceful.
- SECONDARY(오프라인 스캐폴드 + 문서화된 블로커용 graceful 앱 경로):
  - ⭐ `scripts/fetch_contract_details.py` 신설 — 설계서 §18.2 본문 파싱 스캐폴드. list.json으로 '단일판매·공급계약' 보고서 rcept_no 수집 → `document.xml`(zip) 다운로드 → 태그 제거 평문화 → 정규식으로 계약금액(원)·직전매출 대비 비율(%) 추출 → `public/data/contract-signals.json`(ticker → `[{rcept_no, amount, salesRatio, date}]`). `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용. **본문 양식·정규식(RE_AMOUNT/RE_RATIO)·zip 여부는 전부 `⚠️ operator-verify`** — 실보고서로 확인 후 교정. **로컬 실행 안 함.**
  - ⭐ `src/lib/contractDetails.ts` 신설 — `capitalDetails.ts` 미러. `contract-signals.json` lazy try/catch 로드(없으면 `{}` → graceful no-op), `enrichContract(stockCode, signal)`는 `signalType==="single_contract"` + 매칭 행이 있을 때만 `· 계약금액 X억원 · 직전매출 대비 Y%` 사실 절 덧붙임(원→억원 반올림, salesRatio 유한 양수 가드, null/빈값 방어). 다른 파일·SignalHit 타입 무변경.
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — `enrichContract`를 최외곽 래퍼로 추가(`enrichContract(code, enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig))))`). recent 라우트의 `!` non-null 단언 보존. UI 렌더 변경 0(note 한 줄 기존 렌더).
- 카피 안전: 신규 문자열(`신주인수권부사채 발행`·`계약금액 X억원`·`직전매출 대비 Y%`)은 숫자·기관/계약 사실만 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더) / 공유 서버 청크 `.next/server/chunks/5337.js`에 신규 포맷(`신주인수권부사채`·`계약금액`·`직전매출 대비`)이 Pass 7 `발행규모` 절과 함께 존재 확인(enrich는 서버 라우트 코드) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인(로컬에 capital/contract-signals.json 없음).
- 위험/한계: BW 절·계약 절은 각각 `capital-signals.json`(BW 포함)·`contract-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, sample에 가짜 수치 주입은 오인 위험이라 의도적으로 안 함). 단일계약 본문 파싱은 보고서 양식 편차가 커 정규식이 추정 단계 — 운영 키 실호출 검증 전엔 활성화 보류.
- 남은 블로커(정확화): 구조화 엔드포인트 5종(임원·자기주식·유증·CB·BW) enrich 경로 확보 완료. 단일계약은 본문 스캐폴드까지 깔렸고, 정정(correction) 본문(정정 전후 수치)은 아직 미착수.
- 다음 패스(2개·구체·로컬 검증 가능): (a) 본문 XML 스캐폴드 패턴을 correction(정정) enrich로 확장 — 정정 전후 수치 추출, contractDetails와 동일 graceful 패턴. (b) 공시 explorer 명료화 / 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 로컬에서 빌드·렌더로 검증 가능.

## 2026-06-23 · Pass 7 공시 핵심 숫자 — 증자·전환사채 발행 규모 노출 (Task 27, Claude)
- 목표: Pass 6(treasury_buy)가 '다음 패스'로 남긴 capital_raise(증자·CB)를, 투자 로직 무변경으로 동일한 graceful 패턴으로 한 단계 더. 유상증자/전환사채는 자기주식취득·임원 소유보고와 함께 DART가 **본문 XML 없이 구조화 엔드포인트로 규모를 노출**하는 유형이라 가장 보수적인 다음 step.
- 구조화 엔드포인트 근거: 유상증자(`piicDecsn.json`)·전환사채(`cvbdIsDecsn.json`)는 주요사항보고서 구조화 정보(발행금액·자금조달 목적)를 제공. 단일계약(single_contract)·정정(correction)은 여전히 구조화 엔드포인트가 없어 §18.2 본문 XML 파싱 필요 — 이번 패스는 capital_raise만 한정.
- 변경 파일/내용:
  - ⭐ `scripts/fetch_capital_details.py` 신설 — `fetch_treasury_details.py` 미러. `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, 종목당 `piicDecsn.json`+`cvbdIsDecsn.json` 2회 호출(기간 bgn_de/end_de 필수, 최근 365일) → `public/data/capital-signals.json`(ticker → `[{rcept_no, kind, amount, fundsUse, periodBgn, periodEnd, date}]`, kind∈유상증자/전환사채). **로컬 실행 안 함**(키 없음·원격 호출 없음). 필드명(CB 권면총액 `bd_fta`, 유상증자 자금목적 `fdpp_fclt`/`fdpp_op` 등)은 DART 문서 기준 추정 → "⚠️ operator-verify" 주석으로 운영 키 실호출 검증 요청.
  - ⭐ `src/lib/capitalDetails.ts` 신설 — `treasuryDetails.ts` 미러. `capital-signals.json` lazy-load(try/catch, 파일 없으면 `{}`), `enrichCapital(stockCode, signal)`는 `signal.signalType === "capital_raise"` + 매칭 행이 있을 때만 `capitalClause()`로 사실 절(` · 발행규모 X억원 · 자금용도 시설/운영`, 양수·유한수 가드, 원→억원 반올림, fundsUse는 빈값·`-` 방어한 사실 분류 문자열일 때만) 덧붙임. 없으면 원본 그대로. `strength`·`direction`·점수·신호 로직·다른 파일 무변경. `fs`/`path` import만(형제 lib과 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — 기존 합성에 `enrichCapital`을 최외곽으로 추가(`enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))`). UI 편집 0건(`StockDisclosures.tsx`가 이미 `d.signal.note` 한 줄 렌더).
- 카피 안전: 새 문자열(`발행규모 X억원`·`자금용도 …`)은 숫자·사실 분류만 — 증자는 희석 요인이라 호재/악재 판단어를 일절 넣지 않고 규모·용도만 기술. verify_metrics 금칙어 18종(매수/매도/추천/호재 확정 등)과 무충돌, 투자 자문 표현 신규 유입 0.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 공유 서버 청크 `.next/server/chunks/3162.js`에 신규 포맷(`발행규모`·`자금용도`)이 Pass 6 treasury 절(`취득예정`·`취득금액`)과 함께 존재 확인(enrich는 서버 라우트 코드라 공유 server 청크에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인.
- 위험/한계: 새 발행규모 절은 `capital-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임에서 절 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, 데모 sample에 가짜 발행 수치 주입은 사용자 오인 위험이라 의도적으로 안 함). 필드 매핑(`bd_fta`·`fdpp_*`)은 operator-verify 상태 — **송님이 `python scripts/fetch_capital_details.py`(DART 키) 실행** 시 `piicDecsn`/`cvbdIsDecsn` 실응답으로 확인 후 필요 시 매핑만 교정.
- 남은 블로커(정확화): 이제 구조화 엔드포인트가 있는 공시 4종(임원 보유변동·자기주식취득·유상증자·전환사채)은 모두 graceful enrich 경로 확보. 남은 단일계약(계약금액·직전매출 비율)·정정 본문은 구조화 엔드포인트가 없어 여전히 §18.2 DART 보고서 본문(XML) 파싱 파이프라인 필요.
- 다음 패스(1개·구체): single_contract/correction을 위한 §18.2 본문 XML 파서 착수(현재 미구현·유일하게 남은 비구조화 공시 경로). DART `document.xml` 다운로드 → 계약금액·직전매출 비율 추출 스캐폴드부터.

## 2026-06-23 · Pass 6 공시 핵심 숫자 — 자기주식 취득 규모 노출 (Task 25, Claude)
- 목표: Pass 5가 '다음 패스'로 남긴 treasury/contract 핵심 숫자를, 투자 로직 무변경으로 임원 보유변동과 동일한 graceful 패턴으로 한 단계 더. 자기주식 취득은 임원 소유보고(elestock)와 함께 DART가 **본문 XML 없이 구조화 엔드포인트로 규모를 노출**하는 몇 안 되는 유형이라 가장 보수적인 다음 step으로 선택.
- 구조화 엔드포인트 근거: 단일계약(single_contract)·정정(correction)은 구조화 엔드포인트가 없어 여전히 §18.2 본문 XML 파싱이 필요하지만, 자기주식 취득(`tsstkAqDecsn.json`)·증자/CB(`piicDecsn.json`/`cvbdIsDecsn.json`)는 주요사항보고서 구조화 정보가 있음. 이번 패스는 그 중 treasury_buy 신호(`자기주식 취득`)만 한정.
- 변경 파일/내용:
  - ⭐ `scripts/fetch_treasury_details.py` 신설 — `fetch_insider_details.py` 미러. `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, `tsstkAqDecsn.json`(기간 bgn_de/end_de 필수, 최근 365일) 호출 → `public/data/treasury-signals.json`(ticker → `[{rcept_no, acqCnt, acqAmount, periodBgn, periodEnd, date}]`). **로컬 실행 안 함**(키 없음·원격 호출 없음). 필드명(`aqpln_stk_ostk`·`aqpln_prc_ostk`)은 DART 문서 기준 추정 → "⚠️ operator-verify" 주석으로 운영 키 실호출 검증 요청.
  - ⭐ `src/lib/treasuryDetails.ts` 신설 — `insiderDetails.ts` 미러. `treasury-signals.json` lazy-load(try/catch, 파일 없으면 `{}`), `enrichTreasury(stockCode, signal)`는 `signal.signalType === "treasury_buy"` + 매칭 행이 있을 때만 `treasuryClause()`로 사실 절(` · 취득예정 N주 · 취득금액 X억원`, 양수·유한수 가드, 원→억원 반올림) 덧붙임. 없으면 원본 그대로. `strength`·점수·신호 로직·다른 파일 무변경. `fs`/`path` import만(형제 lib과 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — 기존 `enrichInsider` 호출을 `enrichTreasury(...)`로 합성(`enrichTreasury(code, enrichInsider(code, sig))`). UI 편집 0건(`StockDisclosures.tsx`가 이미 `d.signal.note` 한 줄 렌더).
- 카피 안전: 새 문자열(`취득예정 N주`·`취득금액 X억원`)은 숫자·사실만 — verify_metrics 금칙어 18종(매수/매도/추천/호재 확정 등)과 무충돌, 투자 자문 표현 신규 유입 0.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 공유 서버 청크 `.next/server/chunks/2140.js`에 신규 포맷(`취득예정`·`취득금액`·`억원`)이 Pass 5 임원 절(`보유 `·`비율 `·`장내매수 확인`)과 함께 존재 확인(enrich는 서버 라우트 코드라 공유 server 청크에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`·`/005930` 200(source=sample 폴백).
- 위험/한계: 새 취득 절은 `treasury-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임에서 절 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, 데모 sample에 가짜 취득 수치 주입은 사용자 오인 위험이라 의도적으로 안 함). 필드 매핑은 operator-verify 상태 — **송님이 `python scripts/fetch_treasury_details.py`(DART 키) 실행 시** 실제 필드 확인 후 활성화.
- 남은 블로커(정확화): 단일계약 계약금액·직전매출 비율, 정정 본문은 구조화 엔드포인트가 없어 여전히 §18.2 DART 보고서 본문(XML) 파싱 파이프라인 필요. 증자·CB는 구조화 엔드포인트(`piicDecsn.json`/`cvbdIsDecsn.json`)가 있어 이번 패턴으로 확장 가능.
- 다음 패스(1개·구체): capital_raise 신호를 증자(`piicDecsn.json`)·CB(`cvbdIsDecsn.json`) 구조화 엔드포인트로 동일 graceful 패턴 확장(발행 규모·자금용도) **또는** single_contract/correction을 위한 §18.2 본문 XML 파서 착수.

## 2026-06-22 · Pass 5 공시 핵심 숫자(보유 수량·비율) 노출 (Task 23, Claude)
- 목표: 공시 카드 유용성을, 투자 로직 무변경으로 한 단계 더. 직전 패스들이 '다음 제안'으로 남긴 '공시 카드 DART 핵심 숫자 노출'을 **이미 수집 스크립트가 쓰고 있으나 앱이 읽지 않던** 임원 보유 수량·비율로 한정해 안전하게 해소.
- 조사 결과(데이터 형태 확인): `scripts/fetch_insider_details.py`가 elestock.json에서 `ownCnt`(보유 수량)·`rate`(보유 비율)를 이미 `insider-signals.json`에 기록 중. 그러나 `src/lib/insiderDetails.ts`의 `InsiderRow`는 이 두 필드를 읽지 않아 화면에 못 떴음. **신규 파싱·본문 XML 없이** 기존 구조화 데이터를 표시만 하면 됨 → 가장 보수적인 useful step.
- 변경 파일/내용(`src/lib/insiderDetails.ts` 단일):
  - `InsiderRow`에 `ownCnt?: number`·`rate?: string` 추가(스크립트가 이미 쓰는 필드).
  - `holdingClause()` 헬퍼 신설: 값이 있을 때만 `· 보유 N주 · 비율 X%` 사실 절 생성(보유수량 양수 + 비율 유한수치 가드, `%`/공백/`-` 방어). 값 없으면 빈 문자열(graceful).
  - `enrichInsider`의 방향 텍스트(`장내매수 확인 (보고자, +N주)` 등)는 그대로 두고 끝에 보유 절만 덧붙임. `strength`·신호 로직·점수·다른 파일 무변경. import·의존성·신규 props 0건(`StockDisclosures.tsx`가 이미 `d.signal.note`를 `text-[11px]` 한 줄로 렌더 → 데이터 있으면 자동 노출).
- 카피는 사실·비자문 유지: 새 문자열(`보유 N주`·`비율 X%`)은 verify_metrics 금칙어 18종과 무충돌, 투자 자문 표현 신규 유입 없음.
- 검증: `python scripts/verify_metrics.py`(UTF-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 `.next/server/app/api/disclosures/{[ticker],recent}/route.js`에 신규 포맷 문자열(`장내매수 확인`·`보유 `·`비율 `) 존재 확인(enrichInsider는 서버 라우트 코드라 client 청크 아닌 server 번들에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0.
- 위험/한계: 새 보유 절은 `insider-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 API가 sample 폴백(`source: cache/sample`) → 임원 note는 휴리스틱 문자열만 보임(런타임에서 보유 절 미노출 = 정상 graceful no-op). 실제 노출은 **송님이 `python scripts/fetch_insider_details.py`(DART 키) 실행해 `public/data/insider-signals.json` 생성 시** 활성화. 시각 검증은 server 번들 문자열 존재로 대체(데모 sample에 가짜 보유수치 주입은 사용자 노출 '예시 표본' 오인 위험이라 의도적으로 안 함).
- 남은 블로커(정확화): 자기주식 취득/처분 수량·금액, 단일계약 계약금액·직전매출 비율, 증자·CB 규모, 정정 본문 등 **나머지 공시 핵심 숫자는 `list.json`에 없고 설계서 §18.2 DART 보고서 본문(XML) 파싱 파이프라인이 미구현이라 여전히 차단**. 임원 보유변동만 elestock 구조화 엔드포인트 덕에 본문 파싱 없이 가능했음.
- 다음 패스(1개·구체): §18.2 본문 파싱 파이프라인 구축 **또는** 유형별 구조화 엔드포인트 추가 수집(예: 자기주식 취득 수량용 `tsstk.json`)로 treasury/contract 핵심 숫자도 동일 graceful 패턴으로 노출.

## 2026-06-22 · Pass 4 공시·데이터 신뢰도 폴리시 (Task 21, Claude)
- 목표: 첫 사용자 관점에서 공시 카드의 팔레트 불일치·정보 부족·신선도 문구를 소폭 다듬어 신뢰감 보강. 투자 로직·산식 무변경, className/카피만. OneDrive 규칙대로 python(utf-8/LF) 편집.
- 직전 패스(Task 18)가 남긴 1순위 항목 '`StockDisclosures` `gray-*`→`zinc-*` 팔레트 통일 + 공시 note 노출' 해소.
- 변경 파일/내용(`src/components/StockDisclosures.tsx` 단일):
  - **팔레트 통일**: 잔존 `gray-*` 13곳 전부 앱 공통 `zinc-*`로 교체(border/text/hover/active/dot). 다크모드 갭 2곳 보강 — `getBadgeClass` 폴백 배지에 `dark:bg-zinc-800 dark:text-zinc-300`, 로딩 스켈레톤 4줄에 `dark:bg-zinc-800` 추가(이전엔 다크에서 흰 막대로 떴음). grep 결과 `gray-` 토큰 0건.
  - **DART 이해도**: 각 공시 카드 배지 행 아래에 이미 계산돼 있던 `d.signal.note`(예: `장내매수 확인 (보고자, +N주)`·`계약금액·직전매출 비율은 본문 확인 권장`)를 muted 한 줄(`text-[11px] text-zinc-500 dark:text-zinc-400`)로 노출. 새 파싱·props·import·의존성 없음(기존 enrich 결과 표시만).
  - **신선도 문구**: 헤더 `최근 90일 {count}건 신호 {signalCount}건` → `최근 90일 · 공시 {count}건 · 신호 {signalCount}건`(구분점으로 가독성만 개선). 빈 상태 중립 학습 문구는 그대로 유지.
- 카피는 학습용·비자문 유지(매수/매도/추천 신규 유입 없음). 노출되는 note 문자열 10종이 금칙어 18종과 충돌 없음 확인(모두 '확인 권장/필요' 중립 톤).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0. 공시 카드는 client+fetch 게이트라 서버 HTML엔 없어 빌드 청크(`app/stock/[ticker]`)에서 신규 zinc 폴백 배지·note 서브라인 클래스·`유형 자동분류` 문자열 존재 확인.
- 위험/한계: 공시 카드는 client 렌더라 헤드리스 브라우저 없이 픽셀 확인 불가(빌드 청크 문자열·클래스 존재로 검증). note 노출은 enrich 데이터(insider-signals.json) 유무에 graceful — 없으면 휴리스틱 note, 있으면 실제 방향·규모.
- 다음 패스 제안(1개): 공시 카드 DART 본문 핵심 숫자(취득/처분 수량·금액·계약금액 비율) 추출 노출 — 설계서 §18.2, 현재 본문 파싱 미구현이라 블로킹.

## 2026-06-22 · Pass 3 daily-use clarity (Task 18, Claude)
- 목표: 첫 사용자 관점에서 여전히 미완성으로 느껴지는 라벨·빈 상태·신선도 표현을 소폭 보강. 기존 작업(워크트리 clean·stash 0) 보존, OneDrive 규칙대로 python(utf-8/LF)로만 편집.
- 점검 6개 화면(home/today/stocks/watchlist/compare/공시·상세): home·today·stocks·관심종목 빈상태·비교 빈상태·StocksExplorer는 이미 1~2차 패스로 명료화 완료 → 무변경. 신선도(홈 히어로 pill·/today 헤더·푸터)는 모두 `dataMetadata`+`isDataStale` 단일 출처 사용 확인. 사용자 노출 '밸류맵/ValueMap' 잔재 0건(grep).
- 변경 파일/카피:
  - `src/components/WatchlistClient.tsx` — '최근 본 종목' 빈 상태가 한 줄뿐이던 것을 가치 설명(방문 종목 자동 기록·다시 찾기 쉬움) + 최근 10개 한도 안내 + '종목 탐색하러 가기' CTA로 보강(디자인 설계서 §7 history 빈상태 🟡 해소).
  - `src/components/StockDisclosures.tsx` — ① 종목별 공시 빈 상태 '공시가 없습니다'에 "공시 없음은 호재도 악재도 아님" 중립 학습 문구 추가(비자문). ② 소스 배지 영어 Live/Cache/Preview → 한글 실시간/저장본/예시 표본 + 의미 title 툴팁 + 다크 변형(이전 '영어라벨 한글화' 기조 일치).
  - `src/components/CompareClient.tsx` — 비교 화면 다크모드 가독성: 지표 막대 값(text-zinc-900 → 다크 미지정으로 어두운 배경에 거의 안 보이던 것)·막대 트랙·재무 표 best/일반 셀·각주 초록 강조·테마 칩에 누락된 `dark:` 변형 추가(레이아웃·로직 무변경, className만).
- 카피는 학습용·균형·비자문 유지(매수/매도/추천 신규 유입 없음).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /watchlist /compare /disclosures /stock/005930` 모두 200·에러 마커 0. 빈상태/배지는 client+localStorage·fetch 게이트라 서버 HTML엔 없어 빌드 청크에서 신규 문자열 존재 확인(watchlist·stock·compare 청크).
- 위험/한계: 빈 상태·소스 배지·다크 가독성은 client 렌더라 헤드리스 브라우저 없이 픽셀 확인 불가(빌드 청크 문자열·클래스 존재로 검증). StockDisclosures는 여전히 구식 `gray-*` 팔레트(나머지는 `zinc-*`) — 이번엔 범위 한정 위해 미통일.
- 다음 패스 제안(1개): StockDisclosures 전체 `gray-*`→`zinc-*` 팔레트 통일 + 공시 카드 DART 본문 핵심 숫자(취득/처분 수량·금액) 추출 노출.

## 2026-06-21 · AI Dev Center Pass 2 UI 명료화 (Task 14, Claude)
- 목표: P0 패스 이후 실사용 명료화. 기존 작업분(미커밋 3파일) 보존하며 점검·소폭 보강 후 검증·커밋.
- 종목탐색(StocksExplorer): ① 질문형 프리셋(자연어 클릭) — "싸고 거래 늘었나/돈 잘 버는 회사/배당 주는 우량주/대형주 안정형/숨은 소형 저평가" 5종, ② 적용 중 필터를 사람이 읽는 칩으로 노출(칩별 × = 해당 필터만 해제) + 전체 초기화, ③ 헤더에 "조건 충족 N개 / 전체 M개" 가시 카운트.
- 오늘(today): ① "후보를 볼 때 체크리스트" 섹션 신설(원문 확인·고점추격 위험·저평가 이유·점수는 우선순위일 뿐·분산은 스스로 — 비자문 고지 포함), ② 후보 카드별 한 줄 💡 이유 유지(종합/저평가/추세 각 reason 함수).
- 공시(DisclosureExplorer): 카드에 유형 자동분류·종목 식별·제출인(flr_nm)·핵심 note 노출 + 원문 보기 / 종목 상세 / 관심(분석 대상 종목 한정 낙관적 토글) 액션. 분석 대상 외 종목은 DART 원문만 안내.
- 카피는 학습용·비자문 유지(매수/매도/추천 신규 유입 없음).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0) / `npm run build` 성공(전 라우트 프리렌더) / 로컬 프로덕션 서버(127.0.0.1:3000, 시작 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /stocks /today /disclosures /stock/005930` 모두 200·에러 마커 0·UI 마커(질문형 프리셋·체크리스트·💡·원문 보기·제출·관심·조건충족 카운트) 렌더 확인.
- 다음 패스 제안: /stocks 모바일 바텀시트 필터 칩 동기화, 비교 모바일 카드 패턴, 공시 카드 DART 본문 핵심 숫자 추출(취득/처분 수량·금액), 종목상세 결론-위험-근거 재배치.

## 2026-06-20 · AI Dev Center P0 브리프 검증 패스 (Claude)
- 워크트리의 진행분(브랜드 오른스코어 전환 + P0 작업)을 되돌리지 않고 그대로 보존하며 점검.
- P0-1 데이터 일관성: 헤더·푸터·홈·오늘·유니버스·종목상세·상태 모두 `dataMetadata`+`formatBizDate*`/`isDataStale` 단일 출처 사용 확인. 하드코딩 날짜·산식버전 없음(종목상세 주가 기준일만 종목별 가격시계열에서 도출 — 정상).
- P0-2 빈 상태: 관심종목("아직 관심 종목이 없습니다"+가치설명+3 CTA+검색+try/finally 8초 타임아웃), 비교("비교할 종목을 선택하세요"+최대 4개 명시+오늘 Top5/직접 검색/같은 업종 3진입) 소스 검증 완료 — 수정 필요한 갭 없음.
- P0-3/홈 히어로: "10개 이하로 줄이세요"+기준일 pill+"오늘 후보 5개 보기"/"내 조건으로 찾기"+Top5 미리보기+왜 오른스코어 3카드+가치 뒤 안전문구. 렌더 HTML에서 카피 노출 확인. 매수/매도/추천 문구 신규 유입 없음.
- 브랜드 잔재: 사용자 노출 "밸류맵/ValueMap" 0건(렌더 HTML). 잔존 `valuemap_*` localStorage 키·`valuemap:compare-updated` 이벤트명·guide/metrics GitHub URL은 마이그레이션/기능 유지 위해 의도적 보존.
- 빌드 게이트: `npm run build` 성공(전 라우트 프리렌더 OK).
- 브라우저/라우트 스모크: 프로덕션 서버(127.0.0.1:3000)에서 `/ /today /stocks /stock/005930 /watchlist /compare /disclosures /backtest /universe /status` 모두 200, 에러 마커 0, 클라이언트 컴포넌트 경계(관심·비교) SSR 정상.
- 미완/위험: 빈 상태는 client+localStorage 게이트라 헤드리스 브라우저 없이는 서버 HTML로 직접 확인 불가(소스로 검증함). P0-1은 단일 원자적 JSON 스냅샷 전제(배포당 일관) — 풀 DB는 별도 결정 필요.
- 다음 자동화 패스 제안: `/today` 카드별 한 줄 이유 추가 노출, `/stocks` 모바일 바텀시트 필터, 비교 모바일 카드 패턴(가로 테이블 의존 축소), 공시 카드 핵심값 추출.

## 2026-06-19 · AI Dev Center P0 브리프 1차 패스
- AI 센터 큐에 있던 `OrnScore PDF brief P0 automation pass` 기준으로 현재 작업분을 이어 점검.
- 데이터 기준일/산식 버전 공용 헬퍼(`realStocks.ts`) 사용 범위를 확인하고, 헤더·푸터·홈·오늘·유니버스·상태·종목상세의 기준 표기를 동일 출처로 정리된 상태로 검증.
- 관심종목 빈 상태: "아직 관심 종목이 없습니다" 문구, 점수 변화·공시 신호 가치 설명, 종목 탐색/오늘 후보/로그인 동기화 CTA 확인.
- 비교 빈 상태: "비교할 종목을 선택하세요" 문구, 오늘 Top 5/직접 검색/업종 탐색 진입 확인.
- 홈: 히어로를 "오늘 볼 후보를 10개 이하로 줄이세요" 방향으로 보강하고, 왜 오른스코어인가를 `종목 압축`·`산식 공개`·`공시 연결` 3카드로 정리.
- 빌드 검증: `npm run build` 성공.
- 브라우저 확인: `http://127.0.0.1:3000` 홈, `/watchlist`, `/compare`, `/stock/005930`에서 런타임 에러·콘솔 에러 없음 확인. HTTP 스모크는 `/`, `/today`, `/stocks`, `/stock/005930`, `/watchlist`, `/compare`, `/disclosures`, `/backtest` 모두 200.
- 남은 다음 패스: `/today` 카드별 한 줄 이유 강화, `/stocks` 모바일 필터 UX, 비교 모바일 테이블 의존 축소, 공시 카드 핵심값 추출.


## 🆕 라이브 리뷰(2026-06) P0/P1 — 실사용 발견 버그
- ✅ P0-02 공시카드 404 — 홈·오늘 공시카드가 분석대상外 종목도 /stock/로 연결 → DART 원문(외부)+배지로 분기
- ✅ P0-03 수익률 불일치 — 홈/오늘 r3m(FDR)≠차트(prices/json). compute_metrics가 prices/json 읽게 통일(최근253일) → r3m=차트 일치 + r1y 복구. **다음 Run에서 데이터 반영**
- ⬜ P0-01 www.ornscore.com 502 — Vercel에 www 도메인 추가 + apex 리다이렉트(너)
- ⬜ P0-04 알림 출시상태 페이지마다 다름 — feature flag 중앙화
- ✅ P1-02 산식버전 — metricsVersion "phase2-v2"→"2.4" 단일화 + 푸터/상세/universe/status 모두 dataMetadata.metricsVersion 읽음 (next Run 반영)
- ✅ P1-04 업종 분모 — "17개(본인 제외)"·"18곳(본인 포함)" 명시
- ✅ P1-06 V로고 — 헤더·모바일·이메일 전부 O로 + "오른스코어 스톡" 부제 제거
- ✅ P1-07 데이터상태 — 푸터 정적 "정상" → 가격 기준일 신선도 기반(5일+ 지연표시) + /status 링크
- ✅ P0-01 www 502 — Vercel www.ornscore.com 추가 + 308→apex (SSL 생성 중, 너 완료)
- ✅ P0-04 알림 상태 — lib/features.ts 중앙 config + 로그인 "출시예정"→"무료 이용가능"(공시알림 라이브) + 요금제 FREE에 공시알림 추가·PRO는 고급알림 구분
- ✅ P1-01 DART 문구 — "DART API 한도" → "오른스코어 내부 200건 분석 제한"으로 정확화
- ✅ P1-03 동점 순위 — 같은 점수면 "공동 N위" 표시(today 종합 Top)
- ✅ P1-05 빈상태 — 관심종목 무한로딩 차단(try/finally+8초 타임아웃)+에러상태+다시시도. 비교는 빈상태 degrade
- ✅ ORN-011 백테스트 위험 — "수익↑이지만 낙폭↑·위험조정↓" 요약 경고문 추가(벤치 대비 패턴 감지)
- ✅ §4.4 차트 안내 — "길게 터치" → "마우스 올리거나 길게 터치"(PC+모바일)
- ✅ §4.3 종목탐색 — 기본필터/제외 N개 안내 이미 존재
- ⬜ 남은 §4(대규모/데이터): 종목탐색 목록 SSR, 공시 핵심숫자 추출(DART본문), 홈 히어로 간소화, 종목상세 결론-위험-근거 재배치, AI기록 버전, 백테스트 재현설정 다운로드


## 🎨 디자인 설계서 P0 대조 (2026-06)
- ✅ 1 브랜드·로고 통일 (트렌드 O 마크 + 오른스코어)
- ✅ 2 산식버전 통일 (metricsVersion 2.4 단일)
- ✅ 4 데이터상태 칩/페이지 (/status + 푸터 신선도)
- ✅ 6 로그인·약관 사이드바 제거 (Sidebar+MobileBottomNav 경로 hide)
- ✅ 7 관심·비교 빈상태 개선 / ✅ 9 관심종목 무한로딩→에러상태
- ✅ 10 점수 색상 분리 (emerald/blue → 브랜드 인디고+중립, 상승빨강/하락파랑과 구분)
- 🟡 3 상단날짜 중복 / 5 반복고지 축소 / 7 history 빈상태 / 8 모바일 가로넘침 QA / 9 기타 스켈레톤 — 일부 잔여
- ⬜ P1/P2: 페이지 전면 재구성(메인·오늘·탐색·상세·공시), 레이아웃 분리(마케팅/앱/문서/인증), 모바일 바텀시트 — **대규모, 실제 화면 보며 페이지별 반복 필요**

마지막 업데이트: 2026-06-15 (세션: 금지문구·게이트·문자등급제거·신뢰도% + 로드맵)

---

## ✅ 완료 (배포됨 또는 푸시 대기)
- 6.3 거래일 표준 21/63/126/252 — compute_metrics(데이터단)
- 8.4/8.5 위험조정 **백분위화**(선형→백분위) — compute_metrics v2.4
- 8.7 결측 50점 제거(밸류 재가중 + valueNA) — compute_metrics
- 8.9 반올림: composite 원점수 + 화면 Math.round, 80임계값 원점수(compositeOf) 사용 — 모순 없음
- 9.1 문자등급 A+/A/B+ **완전 제거** → 점수 중심 + 상태어(최우선 확인/우선 확인/추가 관찰/일반/조건 낮음) — grade.ts + 종목상세
- 9.4 금지문구 제거(안정적으로 우상향·매수 기회 등) — guide/metrics
- 18.1 공시 "신뢰도 %" → "유형 자동분류"(today 카드·이메일)
- 23.1 라이선스 충돌 해소(오픈소스 표현 제거 + LICENSE 파일 + 약관 명확화)
- 16.1 관심종목 빈 상태 가치 문구
- 13.3 점수 변동 원인(지표별 +/-) — getMetricChangesBatch + today 급변칩 hover 원인
- 16.2 관심종목 전일대비 점수 델타(▲/▼) — watchlist 페이지 델타 fetch + 표시
- 5.3 분석 대상 공개 페이지(/universe) — 138종목 목록·선정기준·데이터기준일·한계 + about 링크
- 7(부분) PER '최근 실적(후행)' 명시 + 기준 안내 — 종목상세 재무탭
- 24 운영 상태 페이지(/status) — 스냅샷 신선도·데이터 소스 상태 + about/universe 링크
- 46 브리핑 Supabase 영속화 — daily-insight cron→daily_insights 테이블 upsert + getLatestStoredInsight + today 브리핑에 AI 요약 표시 (SQL: docs/sql/daily_insights.sql, 너가 실행)
- 9.3 급등 경고 '최근 63거래일(약 3개월)' 거래일 표기
- 11.1 "값 검증 완료" → "이상값 점검 통과"
- 15.3 위험 상세 패널(연환산변동성·최대낙폭·최악의하루·관측일수)
- 15.5 데이터 기준 박스(주가기준일·점수계산·산식버전·분석대상)
- 17.2 비교 공유 URL(/compare?stocks=) + 공유버튼
- 19.1 백테스트 시간순서 / 19.5 벤치마크 명칭 — 이미 준수
- 21 브랜드 오른스코어 통일 + 오타(오른스코어은→는)
- 21.3/26.4 빌드 금칙어 게이트(verify_metrics, 18개 문자열)
- 22 메타: 테마주 문구 제거
- 20.2 PLAN_LIMITS 단일소스(limits.ts)
- [보너스] 현재가 지연시세 라이브(네이버) / 24시간 데이터 자동화(GitHub Actions) / notify 라이브 DART

## 🟡 다음 (코드로 가능 · tsc 환경/awake 권장)
- 22.2 전 페이지 title "X | 오른스코어" 형식 통일 점검
- 11.2 데이터 품질 상태 패널 세분화(가격/재무/공시/경보/교차검증)

## 🟠 진행 중 (인프라 완성, 데이터 검증 대기)
- §10 KRX 시장경보 — **인프라 완성**(marketAlert.ts·market-alerts.json·fetch_market_alerts.py·Action). **데이터 소스 조사 결과(직접 확인)**: ① KRX 데이터포털 시장경보 화면=로그인 필요(무료 자동수집 불가) ② KRX 공식 Open API=시장경보 미제공(가격·기본정보 8종만). **→ 무료 공식 소스 없음.** 남은 옵션: 네이버 per-종목 스크래핑(불안정·샌드박스 테스트 불가, Action 반복검증 필요) 또는 유료. **현재 보류** — 인프라는 받을 준비 완료, 소스 확보 시 fetch_market_alerts만 교체하면 즉시 작동.

## 🔴 차단 (데이터소스·계정·아키텍처 결정 필요 — 단독 불가)
- 4 단일 스냅샷 **DB** 도입 — 현재 정적 JSON은 배포당 원자적이라 페이지불일치 이미 없음. 풀 DB는 과할 수 있음 → **결정 필요**
- 5 유니버스 **관리 테이블**(편입/제외 이력) — 데이터·정책 필요 (※ 공개 목록 페이지 /universe는 5.3 완료)
- 6.2 기업행위(수정주가) — corporate action 데이터 소스 필요(FDR adjustedClose 확인)
- 7 재무 **기준일·Forward PER·교차검증** — DART 재무/컨센서스 **데이터 소스** 필요(ORN-003). ※ PER 라벨/기준안내(표시단)는 부분 완료
- 18.2 공시 핵심 숫자 추출 — DART 본문 파싱 파이프라인
- 19.6 백테스트 시점별 유니버스·OOS·비용민감도 — 백테스트 엔진 확장 + 데이터
- 23.2 개인정보 국외이전 표 — 법무 콘텐츠(사용자 결정)
- 23.3 도메인 이메일(support@/privacy@/data@) — 메일 계정 생성(사용자)
- 24 운영 모니터링 — 공개 상태페이지(/status) 완료. ※ 배치 실패 알림·관리자 전용 상세는 추가 구축 필요
- 26.5/27 E2E·모바일 QA / 28 접근성 / 29 성능 — 실행환경·감사 작업

## 📌 운영자(송) 직접 작업
- Resend ornscore.com 도메인 Verify 확인(대기중)
- Supabase Auth Redirect URLs / Kakao Redirect URI에 ornscore.com 추가
- 위 🔴 항목들의 데이터소스/결정 제공

## 2026-06-16 · 페이지 디자인 재구성 (모바일 우선)
- 메인(page.tsx): 컴팩트 히어로 + '오늘의 데이터' 블록(통계3칸+Top5) 신설, /today와 역할 분리.
- 종목탐색(StocksExplorer): 프리셋·저장조건을 모바일 접이식 '빠른 탐색·저장된 조건'으로 묶어 검색·리스트 상단 배치(데스크탑 lg는 기존대로). 기능 무변경.
- 공시(DisclosureExplorer): 다크모드 버그 수정(카드 bg-white→dark, 기간·필터버튼·SIGNAL_STYLES 다크 변형).
- 오늘(today): 다크모드 버그 수정(통계3칸·SIGNAL_TONE·하단 공시 섹션).
- 종목상세: 이미 다크·모바일 완비 확인 → 무변경.
- 검증: 4파일 파싱 0에러 / 금칙어·한글깨짐 없음. 푸시 대상: page.tsx, StocksExplorer.tsx, DisclosureExplorer.tsx, today/page.tsx.

## 2026-06-16 (2) · 다크모드 전수 감사·수정
- 레포 전체 라이트전용 컬러배경(bg-*-50/from-*-50 dark: 누락) 스캔 → 전부 수정.
- guide/metrics: dark: 0개였음 → 페이지 전면 다크 적용(26곳).
- StockDisclosures·WatchlistClient: 신호색 맵 다크 변형.
- HistoryClient: 호재/리스크 패널 다크. DisclosureExplorer: 에러패널 다크.
- NotificationToggle: 토글 두 상태 다크. StocksExplorer: 카드 인사이트칩 5종 다크.
- 검증: 7파일 파싱 0에러 / 금칙어·한글깨짐 없음 / 최종 재스캔 잔여 0.

## 2026-06-16 (3) · 데이터 검증 + 모바일 QA
- 모멘텀 포화: live 데이터 max=99.3(포화 0개) → 이미 백분위 적용됨. 문제 없음, 재생성 안 함.
- ⚠ 운영 발견: compute_metrics.py=v2.4인데 live metricsVersion=phase2-v2. 데일리 Action이 v2.4를 아직 안 돌림(=v2.4 미push 추정). push 후 Action 돌면 푸터 "Metrics 2.4"로 정리됨.
- 모바일 320px 가로넘침 전수 스캔: 실위험 1건(theme/[slug] 6컬럼 테이블 래퍼 없음) → 가로스크롤 래퍼+min-w 추가.
- theme/[slug]: dark:0(완전 라이트)였음 → 다크모드 전면 + 레이더 SVG currentColor화 + breadcrumb 데드링크 /themes→/stocks.
- 참고: ThemeCard.tsx는 미사용(데드코드), /themes 페이지 없음 — 테마 클러스터 vestigial.

## 2026-06-16 (4) · 라우팅 감사 + /pricing 연결
- 내부 링크·라우팅 전수 감사: 404 데드링크 0건(정적·programmatic 모두). /themes는 이전 수정으로 해소.
- 고아 페이지 발견: /pricing(링크0), /blog·/blog/[slug](링크0). /blog는 WIP로 보류.
- /pricing: 전역 푸터(layout.tsx)에 '요금' 링크 조용히 추가 — 전 페이지 하단 노출.
- node_modules: .gitignore에 정상 포함 확인.


## 2026-06-24 · Pass 11 · 공시 explorer 수집 기준 신선도 라벨 (Task 33, Claude)
- What changed: 공시 신호 페이지(/disclosures)에 '수집 기준 · {KST 시각} · {출처}' 신선도 라벨 추가. 사용자가 보고 있는 공시 묶음이 언제·어디서(실시간/저장본/예시 표본) 수집됐는지 1줄로 표기.
  - `src/app/api/disclosures/recent/route.ts`: live payload에 `fetchedAt`(ISO) 추가, sample 분기에도 `fetchedAt` 추가. cache 분기는 저장된 payload의 fetchedAt를 그대로 carry(원수집 시각 보존). detectSignals·enrich 래퍼·점수·신호강도 무변경(순수 additive).
  - `src/lib/recentSignals.ts`(SSR twin): live·sample 반환에 `source`/`fetchedAt` 추가 → 초기 SSR 렌더에서도 라벨 즉시 노출.
  - `src/components/DisclosureExplorer.tsx`: `ApiResponse`에 `source?`/`fetchedAt?` 추가, `sourceKo`(StockDisclosures SourceBadge와 동일 매핑: 실시간/저장본/예시 표본)·`fmtKST`(명시 timeZone=Asia/Seoul, SSR/CSR 일관) 헬퍼, 헤더 count 줄 아래 `text-[11px] text-zinc-500` muted 라벨. 필드 없으면 graceful(둘 다 없으면 미출력, 시각만 없으면 '수집 시각 미상'). 라이트+다크 동일.
- What passed: `verify_metrics.py`(138종목 0오류·브랜드/금칙어 0, exit 0) · `npm run build`(타입게이트 통과·138p 프리렌더, exit 0, 신선도 라벨 문자열이 `app/disclosures/page` 클라이언트 청크에 컴파일됨) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, `/disclosures` SSR HTML에 `수집 기준 · 2026. 06. 24. 00:07 · 예시 표본`(UTC 15:07→KST 정확 변환) 렌더, `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재.
- Operator-only blocker(변동 없음): DART 키 필요 fetch 스크립트(`fetch_*_details.py` → `public/data/*-signals.json`)는 로컬 미실행. single_contract/correction의 `⚠️ operator-verify` 정규식(`RE_AMOUNT`/`RE_RATIO`/`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`)은 실보고서 본문 대조 필요.
- Next two local tasks: (a) 동일 신선도 라벨을 종목별 `StockDisclosures` 헤더에도 적용 — `[ticker]` 라우트의 `fetchedAt`를 payload에 추가하고 컴포넌트 헤더에 동일 muted 라벨. (b) Pass 10 잔여 후보: `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가 또는 6개 lib의 `*Clause()` ` · `-join 빌더 공통화.

## 2026-06-24 · Repair · GlobalSearch hydration warning 제거 (Task 33 gate fix, Claude)
- Blocker: Playwright DESKTOP 품질게이트가 React hydration 경고로 실패 — "Extra attributes from the server: style" at input(GlobalSearch). AppHeader(Server)→GlobalSearch(client)의 검색 input이 SSR HTML과 클라 vdom 사이 style 속성 불일치(검색 input은 브라우저/확장 후처리로 hydration 전 속성이 주입되는 대표 케이스).
- What changed: `src/components/GlobalSearch.tsx` 검색 input에 `suppressHydrationWarning` 추가(Next.js 권장 처리). 순수 additive 1줄, 로직/스타일 무변경. 동일 컴포넌트를 재사용하는 MobileSearchButton 인스턴스도 동시 커버.
- What passed: `npx tsc --noEmit` exit 0(타입게이트 통과). lint는 ESLint 미구성(대화형 셋업)이라 tsc를 확립된 finite check로 사용.
- What remains: 게이트 재실행으로 Playwright DESKTOP 경고 소거 확인. Pass 11의 next-task(StockDisclosures 신선도 라벨, signalDetailsShared 단위 assertion)는 그대로 유효.
- Next two local tasks: (a) `[ticker]` route payload에 fetchedAt 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) GlobalSearch SSR/CSR 속성 일치 회귀 방지용 input 속성 스냅샷 메모를 docs에 남기기.


## Repair — Playwright 게이트 404(정적 청크) 수정: dev/prod distDir 분리 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP+MOBILE 게이트가 `_next/static/css/app/layout.css`·`chunks/main-app.js`·`app/layout.js`·`app/not-found.js`·`app-pages-internals.js` 404/ERR_ABORTED로 실패.
- Root cause: `npm run build`(prod, 타입게이트)와 게이트의 `next dev` 가 같은 `.next` 를 공유 → 손상. dev HTML은 unhashed 청크 경로를 참조하나 디스크엔 prod-hashed 산출물만 존재해 404. 실행 중 dev 서버에서 6개 중 5개 자산 404 재현.
- Fix: `next.config.mjs` phase 함수화 — dev(`PHASE_DEVELOPMENT_SERVER`)만 `distDir='.next-dev'`. prod는 기본 `.next`(Vercel 무영향), URL 불변. `.gitignore`에 `.next-dev/`.
- Passed: 재기동 dev에서 이전 404 자산 6종 전부 200 + 게이트 5라우트 200·자산 404 0건 · phase별 distDir 확인(dev=.next-dev/prod=undefined) · `tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 exit 0.
- Next two local tasks: (a) `[ticker]` route payload에 fetchedAt 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) `signalDetailsShared.ts` `toEok`/`matchRow` 단위 assertion 추가.


## 2026-06-24 · Repair · Task 15 Playwright DESKTOP 게이트 수정: WelcomeOnboarding 프리페치 abort 제거 (Claude)
- Blocker: Task 15 Playwright DESKTOP 게이트가 `/stocks?_rsc=…`·`/today?_rsc=…`·`/settings/notifications?_rsc=…` 3건 모두 `net::ERR_ABORTED` 로 실패.
- Root cause: `_rsc=` 는 Next App Router 의 RSC 뷰포트 프리페치 요청(공유 토큰 1개 = 한 페이지 렌더의 프리페치 배치). 홈(`/`) 익명·신규 브라우저(게이트 조건)에서 `WelcomeOnboarding` 의 두 `<Link>`(Step·DesktopCard)가 `/today`·`/stocks`·`/settings/notifications` 를 동시에 뷰포트 프리페치 → `next dev` 온디맨드 컴파일(로그상 최초 ~21s)이 끝나기 전에 게이트가 다음 단계로 넘어가며 in-flight 프리페치가 취소 → ERR_ABORTED. (Sidebar·MobileBottomNav·home/* Link 들은 이미 `prefetch={false}` 라 무관 — WelcomeOnboarding 만 누락된 단일 출처, 특히 `/settings/notifications` 의 유일한 익명 홈 출처.)
- Fix: `src/components/WelcomeOnboarding.tsx` 의 `Step`·`DesktopCard` 두 `<Link>` 에 `prefetch={false}` 추가(저장소 기존 nav 컨벤션과 동일). 순수 additive 2줄 — 레이아웃·로직·문구 무변경. prod(Vercel 프리빌드)는 프리페치가 즉시 200이라 영향 없고, dev 게이트에서 abort 가능한 프리페치 자체가 사라짐.
- Passed: `npx tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 exit 0 · `npm run build` 타입게이트·138p 프리렌더 exit 0 · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /stock/005930` 200, `/settings/notifications` 307(익명→로그인 정상 리다이렉트)·에러 0. 홈 익명 렌더의 trio 프리페치 출처가 0건임을 grep 으로 확인(home/* + Sidebar/MobileBottomNav 전부 prefetch={false}).
- Residual: Playwright 미구성으로 ERR_ABORTED 소거는 게이트 재실행으로 최종 확인 필요(정적 분석상 프리페치 속성 제거로 구조적 해소). Task 15 기능(결론 카드)은 무변경.
- Next concrete OrnScore step(변동 없음): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로 추가(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 버튼 스무스 스크롤.


## 2026-06-24 · Repair · Task 15 Playwright 게이트 수정: 홈 stale prod chunk 400 제거 (Claude)
- Blocker: Playwright DESKTOP·MOBILE 둘 다 `400 http://127.0.0.1:3000/_next/static/chunks/app/page-dfb2719986a20cdc.js — net::ERR_ABORTED` 로 실패(홈 `/` 자체 페이지 청크).
- Root cause: 환경 staleness 레이스(코드 결함 아님). 포트 3000 의 `next start` 프로세스(PID 33580, 02:55 기동)가 **구 `.next` 빌드**를 메모리에 로드한 채 살아 있었고, 그 뒤(03:12) `npm run build` 가 `.next` 를 덮어써 홈 청크 해시가 `dfb2719986a20cdc`→`eb287862a9283bf0` 로 바뀜. 살아있는 서버는 여전히 구 해시(`dfb27…`)를 참조하는 HTML 을 내려보내는데 그 청크는 디스크에서 사라져 400. (live 서버에서 `curl /` → HTML 이 `app/page-dfb2719986a20cdc.js` 참조, 해당 청크 요청 → 400 으로 재현 확인. 신 청크 `eb287…` 는 BUILD_ID 불일치로 404 → 서버 전체가 stale.)
- Fix(환경 정리, 소스 무변경): (1) stale `next start`(PID 33580) `taskkill /F` 로 종료 → 3000 free. (2) `npm run clean`(.next 삭제) + `npm run build` 클린 재빌드로 디스크 자가정합. (3) 새 `next start -p 3000` 기동 → 서버가 신 빌드와 일치. Task 15 결론 카드 기능·WelcomeOnboarding 프리페치 수정 모두 무변경.
- Passed: `npx tsc --noEmit` exit 0 · `npm run build` 138p 프리렌더 exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 · 새 서버(3000)에서 홈 HTML 이 디스크와 동일한 `app/page-eb287862a9283bf0.js` 참조, 그 청크 200 · `/ /today /stocks /disclosures /stock/005930` 200, `/settings/notifications` 307(익명 리다이렉트) · **홈과 `/stock/005930` 의 모든 `/_next/static/*` 참조 자산 전수 200(NON-200 0건)** — 게이트가 잡던 청크 abort 소거 확인.
- Residual / 운영 주의: 근본 원인은 게이트 워크플로가 prod 서버를 띄운 채 `.next` 를 재빌드하면 살아있는 서버의 청크 참조가 stale 해지는 것. 권장 시퀀스 = **build → start 순서 고정, 서버 가동 중 재빌드 금지, 게이트 재실행 전 3000 의 잔존 `next start` 선종료**(dev 는 이미 `.next-dev` 로 분리됨, 본 건은 prod `next start`+`build` 가 `.next` 공유 시 발생). Playwright 미구성이라 최종 소거는 게이트 재실행으로 확인.
- Next concrete OrnScore step(불변): Phase 2 — (a) 레벨드 RiskAlertCard 완전 분리, (b) 4지표 미니바 히어로(단일 소스), (c) 업종 비교 전용 탭 + 다음확인 버튼 스무스 스크롤.


## 2026-06-24 · Repair · Task 21 MetricBar 막대색 누락 수정: 런타임 클래스 합성 제거 (Claude)
- Blocker(TESTER FAIL): 정식 게이트(tsc·verify_metrics·build·HTTP 200)는 통과하나, `MetricBar` 가 `c.track`/`c.fill` 의 `text-*` 토큰을 런타임 `.replace(/text-/g,"bg-")` 로 막대 배경색을 합성 → Tailwind 정적 스캐너가 `bg-*` 리터럴을 못 잡아 빌드 CSS 에서 누락. 라이트모드 60~79(sky) 구간이 무색(홈 후보 카드), 다크모드는 대부분 구간 무색 → 점수 색 통일 목표 깨짐.
- Root cause: Tailwind v4 는 소스에 리터럴로 존재하는 클래스명만 생성한다. 게이지는 `text-*`(scoreColor.ts 에 리터럴 존재)에 SVG `currentColor` 라 정상이었으나, 막대 `bg-*` 변형은 소스 어디에도 리터럴이 없어 누락.
- Fix: `src/lib/scoreColor.ts` 의 `ScoreColor` 에 `barFill`·`barTrack`(bg-* 리터럴) 필드 추가 — 4구간 전부 라이트+다크 bg 리터럴 명시(high `bg-blue-600/400`, good `bg-sky-500/400`, neutral `bg-amber-500`, low `bg-zinc-400/500`, track `bg-zinc-200/800`). `MetricBar.tsx` 는 런타임 치환을 버리고 `c.barFill`/`c.barTrack` 를 그대로 사용. 단일 색 소스 원칙 유지, 점수 계산식/데이터/공시 로직 무변경.
- Passed: `npx tsc --noEmit` exit 0 · `npm run build` 138p 프리렌더 exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4 일치 · 빌드 CSS 에 8개 구간 bg 클래스 전수 존재(`bg-sky-500`/`bg-sky-400:is(.dark *)`/`bg-zinc-500:is(.dark *)` 등 다크변형 포함) · 로컬 prod(3100) `/ /stocks /stock/005930 /guide/metrics` 200 · 렌더된 홈 HTML 에 `bg-sky-500`/`bg-sky-400`(60~79 구간 막대) 실제 출력 확인.
- Residual: 없음(스타일 한정 수정). 향후 새 점수 시각화는 동일하게 scoreColor 의 리터럴 토큰을 쓰고 런타임 클래스 합성은 금지.


## 2026-06-25 · Repair · Task 24 Playwright 게이트 수정: /stocks stale prod chunk 400 (Claude)
- Blocker: Playwright DESKTOP·MOBILE 둘 다 `400 .../_next/static/css/e1593cd0a575ab11.css`·`400 .../_next/static/chunks/app/stocks/page-60397daaa5cf26e3.js — net::ERR_ABORTED` 로 실패.
- Root cause: 코드 결함 아님 — Task 15 때와 동일한 환경 staleness 레이스. 포트 3000 의 `next start` 프로세스(PID 27200, 부모 PID 11724 이미 종료된 고아 프로세스)가 **구 `.next` 빌드**를 메모리에 로드한 채 살아 있고, 그 뒤 `.next` 가 재빌드되어 청크 해시가 바뀜(css `e1593…`→`d1665…`, stocks `page-60397…`→`page-7d957…`). 살아있는 서버는 여전히 구 해시를 참조하는 HTML 을 내려보내는데 그 청크는 디스크에서 사라져 400. (live 3000 에서 `curl /stocks` → HTML 이 `e1593…css`·`page-60397…js` 참조 재현 확인. 구 css 요청 → 400, 신 css 요청 → BUILD_ID 불일치 404 → 서버 전체가 stale.)
- 진단·검증(소스 무변경): (1) `npx tsc --noEmit` 0 · `npm run build` exit 0(`/stocks` 13.9 kB·138p 프리렌더) → Task 24 Phase 4 코드 자체는 정상 빌드. (2) 빈 포트 3255 에 `next start`(내가 띄운 PID 19724) 로 **신 빌드 검증** → `/stocks` 200, 참조 css `d1665…` 200·js `page-7d957…` 200(NON-200 0건), 보기 모드 마커(`카드형`/`표형`/`종합점수`) SSR 렌더, `/ /today /stock/005930` 200, 런타임 에러 0. 검증 후 PID 19724 만 종료(3000·4310 무중단). (3) `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4.
- 복구 완료(Codex): 3000 의 고아 stale `next start` PID 27200 만 종료하고, 신 빌드로 포트 3000 을 PID 23992 로 재기동. 4310 은 중단하지 않음. `/stocks` 200, `카드형`/`표형`/`종합점수` SSR 마커 확인, 예전 stale 청크(`e1593cd0a575ab11.css`, `page-60397daaa5cf26e3.js`) 참조 없음. `/ /stocks /today /stock/005380 /compare /backtest` 모두 200. 코드/빌드/데이터 변경은 일절 불필요했으며, AI Center DB 는 Task 24 completed 로 정합화 후 Task 25부터 재개.
- 운영 권장(Task 15 잔여와 동일): prod `next start` 가동 중 `.next` 재빌드 금지, build→start 순서 고정, 게이트 재실행 전 3000 잔존 `next start` 선종료.


## 2026-06-25 · Repair · Task 25 Playwright 게이트: /stocks·/ stale prod CSS 400 (Claude)
- Blocker(QUALITY-GATE): Playwright DESKTOP·MOBILE 둘 다 `400 http://127.0.0.1:3000/_next/static/css/d1665e0e41509995.css — net::ERR_ABORTED` + `/?_rsc=...`·`/stocks?_rsc=...` ERR_ABORTED 로 실패.
- Root cause: 코드 결함 아님 — Task 15·24 와 동일한 환경 staleness 레이스가 재발. 포트 3000 의 `next start`(PID 23992) 는 **Task 24 복구 때 Codex 가 띄운 `d1665e0e…css` 빌드**를 메모리에 로드한 채 살아 있는데, Task 25(`b697386`) 가 커밋되고 `.next` 가 재빌드되며 CSS 해시가 `d1665e0e…`→`302c90d13f468b6d` 로 바뀜. 살아있는 PID 23992 는 여전히 구 해시(`d1665e0e…`)를 참조하는 HTML 을 내려보내는데 그 CSS 는 디스크에서 사라져 400(`_rsc` RSC 프리페치도 BUILD_ID 불일치로 abort). live 3000 에서 `curl /` → HTML 이 `d1665e0e…css` 참조 + 그 자산 요청 → 400, 신 CSS `302c90d…` 요청 → 404(서버 전체 stale) 로 재현 확인.
- 진단·검증(소스 무변경, 신 빌드 정상 입증): (1) `npx tsc --noEmit` exit 0. (2) `npm run build` exit 0 — Task 25 `/stock/[ticker]` 13.9 kB·138p SSG, 신 CSS `302c90d13f468b6d.css`. (3) `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0·산식 2.4 일치. (4) 빈 포트 3251 에 `next start`(내가 띄운 PID 20368) 로 신 빌드 검증 → `/ /stocks /today /stock/005380 /stock/005930` 전부 200, 참조 CSS `302c90d…` 200(NON-200 0건, stale `d1665e0e…` 참조 없음), `/stock/005380` SSR 에 Task 25 마커(`종합 점수` 게이지·`초보자는 이렇게 보세요`·`먼저 확인할 것`·`같은 업종 비교`·`현재` 강조) 전수 렌더, 런타임 에러 마커 0. 검증 후 **내가 띄운 PID 20368 만 종료**(3000 PID 23992·4310 PID 24672 무중단 확인).
- 복구 완료(Codex): 3000 의 stale `next start` PID 23992 만 종료하고, 포트 3000 을 신 빌드로 PID 13444 로 재기동. 4310(PID 24672) 은 중단하지 않음. `/stock/005380` 200, Task 25 마커(`탐색 우선도`·`자체 지표 4종`·`초보자는 이렇게 보세요`·`같은 업종 비교`) SSR 렌더 확인, 참조 정적 asset 12개 전수 200(BadAssets 0). `/ /stocks /stock/005380 /stock/005930 /disclosures /backtest` 모두 200. AI Center DB 는 Task 25 completed 로 정합화 후 Task 26부터 재개.
- 운영 권장(Task 15·24 잔여와 동일·항구적): prod `next start` 가동 중 `.next` 재빌드 금지, build→start 순서 고정, 게이트 재실행 전 3000 잔존 `next start` 선종료.


## 2026-06-25 · Repair · Task 36 P1-B Playwright 게이트: /stocks 검색 input hydration 경고 (Claude)
- Blocker(QUALITY-GATE PLAYWRIGHT DESKTOP): `Warning: Extra attributes from the server: style at input ... at StocksExplorer` — /stocks SSR 후 hydration 시 검색 input 에 서버/클라이언트 속성 불일치 경고가 콘솔에 떠 게이트 실패.
- Root cause: Task 36 에서 종목명·코드 검색 input 을 컴포넌트 최상단(질문형 프리셋 위)으로 이동해, 페이지에서 SSR 시점에 가장 먼저 렌더되는 텍스트성 input 이 됨. 브라우저 자동완성/확장(또는 폼 자동채움)이 hydration 직전 이 첫 input 에 `style` 속성을 주입해 React 가 "Extra attributes from the server: style" 를 경고. 소스에는 `style` 속성이 없으며(grep 0건), 점수/필터 로직과 무관한 순수 표현 이슈.
- Fix: `src/components/StocksExplorer.tsx` 검색 input 에 `suppressHydrationWarning` 추가(Next.js 권장 처방). 동작·스타일·필터 로직 무변경. 상세 필터 안의 number/range/checkbox input 들은 showAdvanced/drawer 가 열려야 렌더돼 초기 SSR 대상이 아니므로 첫 검색 input 한 곳만 수정으로 충분.
- Passed: `npx tsc --noEmit` exit 0 · `npm run build` exit 0(/stocks 14.2 kB·138p 프리렌더, 라우트 전수 빌드). Korean 문구 무손상 확인(grep).
- Residual: 없음(속성 한정 수정). 향후 SSR 첫 렌더에 노출되는 폼 input 추가 시 확장 주입 대비 동일 처방 고려.
