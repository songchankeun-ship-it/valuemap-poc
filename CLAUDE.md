# ValueMap (밸류맵 스톡) 프로젝트 인수인계 문서

> Claude(나)가 송찬근 송님의 ValueMap 작업을 다른 PC/세션에서 이어가기 위한 인수인계 문서.
> 새 세션 시작 시 이 파일을 첫 메시지로 보여주세요.

---

## ⏱️ 지금 상태 한눈에 (2026-06-13 갱신 · 최신)

- **메인 작업 PC = dongy** (`C:\Users\dongy\OneDrive\바탕 화면\valuemap-poc`). Cowork 폴더 연결.
- **외부 리뷰 3건 반영 완료·배포**: 데이터 리뷰 2회(6.5→7.2) + 디자인 리뷰 1회(7.2).
  - ✅ 1순위 9개 / 2순위 5개 / 3순위(브리핑·오늘의 변화)
  - ✅ 2차 데이터 리뷰 P0: 업종 오분류 수정·백테스트 면책·이상데이터 검증보류·영어라벨
  - ✅ 디자인 P0: 종목상세 상단 재구성(결론·등급·순위·백분위 막대)·백테스트 SOON 제거·**브랜드 "밸류맵 스톡"**·재무 단위(배)·비교 빈화면
  - ✅ 공시 본문 앱연동(코드)·업종 전수 audit(완성차 자동차 분류 수정)
- 마지막 push commit: `9876a23`. **이후 미push 배치 있음**(공시연동·자동차 audit·이 문서) — 아래 push 필요.

### ▶ 다음 세션에서 바로 할 일 (우선순위)
1. 작업 시작 전 `git pull`. (아래 '미push 배치' 먼저 push)
2. **모멘텀 100점 포화 → 백분위 재생성**: 현재 종목상세는 '상위 X%' 표시로 완화했으나 raw 점수는 saturate. `compute_metrics`에서 백분위/윈저라이징으로 재계산 + stocks.json 재생성 필요(가격 데이터로).
3. **공시 본문 실데이터**: `python scripts/fetch_insider_details.py`(DART 키) → `public/data/insider-signals.json` 생성. 생성되면 앱이 자동으로 임원 실제 방향(매수/매도)·규모 표시(`src/lib/insiderDetails.ts` 연동 완료).
4. **백테스트 생존편향 실해결**: 시점별 유니버스 재구성(큰 작업). 현재는 면책 문구로 안내.
5. **KRX 공식 업종코드 연동**: 현재 sector.ts는 테마 기반 휴리스틱. 공식 업종 매핑으로 교체 권장.
6. **디자인 2배치**: 색상 역할 고정·카드 중첩 축소·모바일 하단 시트 필터(화면 보며 반복 권장).
7. 4순위 수익화: `docs/monetization-strategy.md` 참고(무료/유료 + 법무 가드레일). `/pricing` + waitlist.
8. 도메인 결정(KSift 유력, valuefit.com 비추) 후 브랜드 마이그레이션.

---

## ⚠️ 이 폴더 작업 시 반드시 지킬 것 (시행착오로 배움)

1. **파일 편집은 python/bash로만.** OneDrive 동기화 폴더라 **Edit 도구로 쓰면 한글이 깨진다.** `python3`로 `open(...,encoding="utf-8",newline="\n").write(...)`. tsc로 항상 검증.
2. **git은 송님 PowerShell에서.** 샌드박스 bash는 `.git/index.lock` 못 지움. `git show HEAD:path`(읽기)는 됨.
3. **대괄호 경로**(`stock/[ticker]`, `theme/[slug]`)는 `git --literal-pathspecs add "..."`.
4. **CRLF 노이즈**: 저장소 전체 CRLF라 status에 파일 잔뜩 떠도 내용변경 아님. **실제 바꾼 파일만 마커 grep으로 골라 add.**
5. push 전 `Remove-Item .git\index.lock -ErrorAction SilentlyContinue`.
6. **stocks.json 수정 시** BOM/CRLF 보존 + 특정 종목만(전역 sed 금지 — 다른 종목 오염).

---

## 👤 사용자 / 🌐 프로젝트
- 송찬근(Song) · songchankeun@gmail.com · 필로소디. 한국어 친근 반말, "송님", 이모지, 빠른 푸시 선호.
- 밸류맵 스톡 · https://valuemap.kr · GitHub songchankeun-ship-it/valuemap-poc · main push 시 Vercel 자동배포.
- Next.js 14 App Router / Tailwind v4(다크) / Supabase(Auth 매직링크+카카오, daily_scores) / Resend / Vercel cron.
- 데이터: `public/data/stocks.json`(138종목), `prices/{ticker}.json`(5년), `backtest-result.json`(realData), `insider-signals.json`(스크립트 생성 시).
- 브랜드: "밸류맵"이 부동산앱과 충돌 → 전역 **"밸류맵 스톡"** 보조표기 적용. 개명(KSift) 미결정. valuefit.com 비추.

## 📊 지표 & 공시
- 4지표: 모멘텀 / 거래활성도(구 자금흐름) / 밸류 / 변동성조정. 종목상세는 '상위 X%' 백분위로 표시.
- DART 5종: 자기주식취득 / **임원·주요주주 보유 변동**(방향 긍정/부정/확인) / 정정 / 단일계약 / 증자·CB.

---

## ✅ 완료 작업 (전부 배포, 단 최신 배치는 미push)

- **1순위(9)**: 공시 오분류 수정·기간통일·거래활성도 개명·신뢰도%·실험지표·번호중복·점수표현·123/138설명·극단값검증+캐시.
- **2순위(5)**: 등급화(grade.ts)·완성도%·산식공개·업종밸류(sector.ts)·공시방향+스크립트.
- **3순위**: 오늘의 브리핑·오늘의 변화(신규진입·점수급변, Supabase).
- **2차 데이터 리뷰 P0**: 업종 오분류(기업집단 제외)·현대지에프홀딩스 데이터교정·백테스트 면책/알파→누적초과수익·이상데이터 등급 검증보류·영어라벨 한글화.
- **디자인 P0**: 종목상세 상단 재구성(결론카드+등급+전체/업종순위+강점위험, 4지표 상위X% 막대)·백테스트 SOON제거·브랜드 밸류맵 스톡 전역·재무 단위(배)·비교 빈화면 예시칩.
- **공시 본문 앱연동**: `insiderDetails.ts` — insider-signals.json 있으면 실제 방향·규모, 없으면 추정 유지(graceful). 두 disclosure API 연동.
- **업종 audit**: 전수 분류 결과 미분류 0. 완성차(현대차·기아 등) '전기차' 테마로 2차전지 오분류되던 것 → 자동차 규칙 우선순위 상향으로 수정.

## 📁 핵심/신규 파일 (⭐ 신규)
```
src/lib/ dataQuality.ts grade.ts sector.ts ⭐insiderDetails.ts disclosure-signals.ts signalGuide.ts
src/components/ StocksExplorer BacktestClient DisclosureExplorer StockDisclosures AppHeader CompareClient
src/app/stock/[ticker]/page.tsx(상단재구성·백분위·등급·업종밸류) today(브리핑·변화) backtest guide/metrics
src/app/api/disclosures/{[ticker],recent}/route.ts(insider 연동)
scripts/ fetch_insider_details.py(DART elestock) run_real.py fetch_prices.py(5년)
docs/monetization-strategy.md(수익화 전략+법무)
```

## 🔑 환경변수 (Vercel)
NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY / CRON_SECRET / DART_API_KEY / ANTHROPIC_API_KEY

## 🚀 사이클
Claude가 python/bash 편집 + tsc 검증 → 변경파일 마커로 추출 → 송님이 PowerShell에서 `--literal-pathspecs add` + commit + push (Claude는 main 직접 push 안 함).

## 📌 마지막 commit (push된 것)
`9876a23` 디자인 브랜드배치 / `d747dd2` 종목상세 상단재구성 / `a7327bb` 2차리뷰P0 / `0d350ee` 브리핑 / `78645f5` 수익화문서 / `018095c` 오늘의변화 ...
- **미push 배치(이번 세션 마지막)**: `src/lib/insiderDetails.ts`(신규), `src/app/api/disclosures/[ticker]/route.ts`, `src/app/api/disclosures/recent/route.ts`, `src/lib/sector.ts`, `CLAUDE.md` → commit 예: `feat: 공시 본문 앱연동 + 업종 audit(완성차 분류 수정) + 인수인계 갱신`

---
마지막 업데이트: 2026-06-13 (리뷰 3건 반영 + 디자인 + 공시연동 + 업종 audit. 브랜드 밸류맵 스톡)
