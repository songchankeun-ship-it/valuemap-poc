# ValueMap (밸류맵) 프로젝트 인수인계 문서

> Claude(나)가 송찬근 송님의 ValueMap 작업을 다른 PC/세션에서 매끄럽게 이어가기 위한 인수인계 문서.
> 새 세션 시작 시 이 파일을 첫 메시지로 보여주세요.

---

## ⏱️ 지금 상태 한눈에 (2026-06-13 갱신)

- **메인 작업 PC = dongy** (`C:\Users\dongy\OneDrive\바탕 화면\valuemap-poc`). Cowork 폴더 연결됨.
- **외부 프로덕트 리뷰(6.5/10) 반영 작업 대거 완료 + 배포:**
  - ✅ **1순위(즉시 수정) 9개 전부** 완료·배포
  - ✅ **2순위(신뢰도 강화) 5개** 완료·배포 (등급화·완성도·산식공개·업종밸류·공시방향)
  - ✅ **3순위 일부**: '오늘의 브리핑' 밴드 배포
- 최신 commit: `0d350ee`. valuemap.kr 라이브.

### ▶ 다음 세션에서 바로 할 일
1. 작업 시작 전 `git pull`.
2. 남은 **3순위 재방문 강화**: 관심종목 어제 대비 점수 변화 / '오늘 신규 진입 종목' / 점수 급변·공시 알림 발송 → **Supabase daily_scores 일별 스냅샷·cron 연동 필요(운영 환경에서 검증)**.
3. **4순위 수익화**: 무료/유료 구조(알림·조건저장·장기기록·업종비교·백테스트·CSV). "점수 자체보다 시간 절약·알림"이 유료 가치.
4. **공시 본문 앱 연동**: `scripts/fetch_insider_details.py`(DART elestock) 실행 → `insider-signals.json` → 앱이 실제 매수/매도 방향 표시하도록 연결.
5. 도메인 결정(KSift 유력, valuefit.com 비추) 후 브랜드 마이그레이션.

---

## ⚠️ 이 폴더 작업 시 반드시 지킬 것 (중요 — 시행착오로 배움)

1. **파일 편집은 python/bash로만.** OneDrive 동기화 폴더라 **Edit 도구로 쓰면 한글(멀티바이트)이 깨진다.** 반드시 `python3`(또는 sed)로 `open(...,encoding="utf-8",newline="\n").write(...)` 방식 사용. tsc로 항상 검증.
2. **git 작업은 송님 PowerShell에서.** 샌드박스 bash는 `.git/index.lock`을 못 지움(Operation not permitted). `git show HEAD:path`(읽기)는 됨.
3. **대괄호 경로**(`src/app/stock/[ticker]/page.tsx`, `theme/[slug]`)는 git이 glob으로 오해 → `git --literal-pathspecs add "..."` 사용.
4. **CRLF 노이즈**: 저장소 전체가 CRLF라 `git status`에 파일이 잔뜩 떠도 내용 변경 아님. **실제 바꾼 파일만 골라서 `git add`** (마커 grep으로 추출).
5. push 전 `Remove-Item .git\index.lock -ErrorAction SilentlyContinue` 한 줄 넣어주면 안전.

---

## 👤 사용자 정보
- **이름**: 송찬근 (Song) / **이메일**: songchankeun@gmail.com / **회사**: 필로소디
- **대화**: 한국어 친근한 반말, "송님" 호칭, 이모지 적극. 적극적 푸시·빠른 행동 선호.

## 🌐 프로젝트 개요
- 밸류맵(ValueMap) · https://valuemap.kr · GitHub: songchankeun-ship-it/valuemap-poc · 브랜치 main(push 시 Vercel 자동배포)
- Next.js 14 App Router / Tailwind v4(다크모드) / Supabase(Auth: 매직링크+카카오) / Resend / Vercel cron
- 데이터: `public/data/stocks.json`(138종목), `prices/{ticker}.json`(5년 시계열), `backtest-result.json`(realData), Supabase `daily_scores`

### 브랜드 마이그레이션(도메인 미결정)
- "밸류맵"이 부동산앱과 충돌 → 개명 결정. **KSift** 유력. **valuefit.com 비추**(이미 등록·상표충돌·의미약함). 도메인 구매는 송님 직접.

## 📊 4대 지표 + 공시 신호
- 모멘텀 / **거래활성도**(구 '자금흐름' — 거래량 변화라 개명) / 밸류 / 변동성조정
- DART 5종: 자기주식취득 / **임원·주요주주 보유 변동**(구 '매수' — 방향 단정 금지로 수정) / 정정 / 단일계약 / 증자·CB

---

## ✅ 완료 작업 (2026-06-13 리뷰 반영 — 전부 배포됨)

### 1순위 (즉시 수정) — 9개
1. **공시 오분류 수정(P0-1)**: '임원 매수'→'보유 변동' + 방향(긍정/부정/확인필요) 판정. `disclosure-signals.ts`, `signalGuide.ts` + 렌더 컴포넌트 전부.
2. 공시 기간 통일: DisclosureExplorer 기본 3→7일(페이지 설명과 일치).
3. '자금흐름'→'거래활성도' 전역.
4. '강도'→'분류 신뢰도 %' (호재 오해 방지).
5. 종합점수 '실험 지표' 문구 + 배지.
6. 초보자 해석 '1. 1.' 번호중복 수정(list-none).
7. 점수변화 '2일'→'데이터 N회(수집중)'.
8. 종목탐색 123/138 제외사유 설명.
9. **극단값 검증**: `dataQuality.ts` — PER<1·PER≥300·ROE≥80·PBR≥20·6개월±150% 감지 → 종목상세 ⚠ 박스. + 주요페이지 `revalidate=3600`(캐시 일관성).

### 2순위 (신뢰도 강화) — 5개
1. **점수 등급화**: `grade.ts` (A+/A/B+/B/C+/C/D) — 종목상세 표시.
2. **데이터 완성도 %**: `dataQuality.ts dataCompleteness()` — 종목상세.
3. **지표 산식 공개**: `guide/metrics` 보강(계산기간·수익률종류·무위험률·**한계점**) + 오픈소스 metrics.ts 링크.
4. **업종 대비 밸류**: `sector.ts` (테마→12섹터 매핑) — 동종 업종 내 PER·PBR 분위 카드.
5. **공시 방향 노출**: direction 배지(긍정/부정/확인) + 정적 샘플 JSON 정합화 + `fetch_insider_details.py`(DART elestock 임원거래 수집 스크립트, 송님 키로 실행).

### 3순위 (재방문) — 일부
- **'오늘의 브리핑' 밴드**: today 상단 시장분위(상승/하락)·종합80+·거래활성도급증·공시신호 건수.

### 그 이전 세션
- 종목탐색 필터 강화(시총·ROE·배당·적자제외·시장 + 질문형 프리셋), 백테스트 5년 실데이터(`run_real.py`,`BacktestClient.tsx`), SEO·온보딩·초보자해석·다크모드 등.

---

## 📁 신규/핵심 파일 (이번 작업 ⭐)
```
src/lib/dataQuality.ts ⭐  grade.ts ⭐  sector.ts ⭐  disclosure-signals.ts(방향)  signalGuide.ts
src/components/StocksExplorer.tsx  BacktestClient.tsx ⭐  DisclosureExplorer.tsx(방향배지)  StockDisclosures.tsx
src/app/stock/[ticker]/page.tsx(등급·완성도·업종밸류·극단값·revalidate)  today/page.tsx(브리핑)  guide/metrics/page.tsx(산식)
scripts/fetch_insider_details.py ⭐(DART elestock)  run_real.py ⭐  fetch_prices.py(5년)
public/data/insider-signals.json (스크립트 실행 시 생성 예정)
```

## 🔑 환경변수 (Vercel)
NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY / CRON_SECRET / DART_API_KEY / ANTHROPIC_API_KEY

## 🚀 새 PC / 세션 시작
1. `git clone … valuemap-poc` → Cowork에 폴더 연결.
2. 첫 메시지: "CLAUDE.md 읽고 맥락 잡아줘. 이어서 작업하자!"
3. 사이클: Claude가 python/bash로 편집+tsc검증 → 변경파일 알려줌 → 송님이 PowerShell에서 `--literal-pathspecs add` + commit + push.

## 📌 마지막 commit
- `0d350ee` 오늘의 브리핑 밴드 / `1f58749` 공시 방향+스크립트 / `0248799` 2순위 신뢰도강화 / `765bc5e` 극단값·캐시 / `bf9b916` 1순위 / `e2eb454` 백테스트5년 / `ccf0421` 필터강화
- 다음: `git pull` → 작업 → `git push`.

---
마지막 업데이트: 2026-06-13 (외부 리뷰 1·2순위 전부 + 3순위 브리핑 배포. dongy 메인, Cowork 연결, python편집 원칙 확립)
