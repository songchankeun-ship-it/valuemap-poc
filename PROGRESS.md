# 오른스코어 안정화·고도화 PROGRESS

> 최종 설계서(33섹션) 기준 진행 추적. 세션이 끊겨도 이 파일로 이어간다.
> 규칙: 작은 단위 plan→실행→검증(구문/compile)→기록. 위험한 것만 사용자 확인.
> 검증 도구: `node /tmp/syntaxcheck.js`(TS 구문) · `python3 scripts/verify_metrics.py`(데이터+브랜드 게이트) · Vercel 빌드(최종 타입게이트).
> 제약: OneDrive 폴더 → python/bash로만 편집(Edit 도구 한글 깨짐). 대괄호 경로 git add는 `--literal-pathspecs`. push 전 `git pull`(봇이 매일 커밋).


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
