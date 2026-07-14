# 밸류맵 (ValueMap) PoC v6

> 주달 같은 한국 테마주 정보 사이트의 후발주자 MVP.
> 차별점: **자체 지표 4종 + 백테스트 + 글로벌 통합 + AI 분석 + 일일 인사이트 + DART 실데이터 + 정직한 데이터 톤**.

이 PoC는 DB·DART·Claude 키 없이도 더미·샘플 데이터로 **즉시 동작**합니다. 환경변수 채우면 단계적으로 라이브 모드로 전환.

## v6 신규 (vs v5) — DART 실데이터 통합
- **/disclosures 공시 신호 탐색 페이지** — 최근 7일 전체 시장 공시에서 5가지 신호 자동 추출
- **종목 상세에 실제 DART 공시** — `/stock/[ticker]`에 진짜 공시 + 신호 배지(자기주식·내부자·정정·계약·증자)
- **DART API 클라이언트 (TS)** — `listDisclosuresByStock()`, corp_code 자동 매핑
- **5가지 신호 디텍터** — dart-signals 봇의 Python 로직을 TS로 포팅, 동일 정규식·강도 점수
- **corp_code 자동 다운로드·캐시** — 첫 호출 시 zip 받아 파일 캐시(7일), 의존성 `jszip`

## v5 신규 (vs v4)
- **/stocks 검색·필터 페이지** — 50개 종목 풀 + 16가지 정렬 + 테마·PER·PBR·종합점수 필터
- **글로벌 검색 자동완성** — 모든 페이지 헤더에서 종목·테마 점프
- **메인 페이지 일일 AI 인사이트** — 매일 06:00 KST에 Vercel Cron이 자동 갱신 (`/api/cron/daily-insight`)
- **테마 인사이트 프롬프트** — 5개 테마 통합 분석, 호재·리스크·watch points 자동 추출

## DART 셋업 (5분)

1. **API 키 발급**: https://opendart.fss.or.kr → 가입 → 인증키 신청 (즉시 발급, 무료)
2. `.env`에 `DART_API_KEY` 입력
3. `pnpm install`로 `jszip` 설치
4. 첫 요청 시 corp_code 자동 다운로드 (1.5MB, 7일 캐시)

API 키 없으면 `public/disclosure-samples/`의 사전 생성 샘플로 폴백 — 5종목 데모는 항상 작동.

---

## 0. 출시 전 로컬 프리플라이트 (release preflight)

배포를 승인/요청하기 **전에 로컬에서 딱 이 순서**만 통과시키면 됩니다. 개별 게이트(tsc·지표 검증·애널리틱스 계약·빌드·라우트 헬스)를 하나씩 기억하지 말고, `release:preflight` 한 명령으로 묶어 실행합니다. **로컬 전용·결정적**이며 서버를 절대 직접 띄우거나 종료하지 않습니다(상시 AI Center :4310 보호). push/deploy/라이브 호출도 하지 않습니다.

```powershell
# 1단계 — 오프라인 게이트 + 빌드 (서버 불필요):
#   typecheck → verify:metrics(python) → verify:route-analytics → verify:click-analytics → build
npm run release:preflight

# 2단계 — 방금 빌드로 전용 하이포트(3000/4310 금지) prod 서버를 직접 띄운 뒤,
#   --base 를 붙여 재실행하면 라우트 헬스(verify:local)까지 포함됩니다.
#   verify:local = smoke:check --all · verify:routes · stocks-seo · public-seo
#                  · login-preflight · admin-access(오너 전용 라우트 접근)
npx next start -p 4478
npm run release:preflight -- --base http://127.0.0.1:4478 --no-perf
# → 끝나면 방금 띄운 그 리스너만 종료. 전체 초록이면 로컬 프리플라이트 완료.
```

- `--base` 를 주면 서버가 이미 빌드·기동됐다는 뜻이라 `build` 는 자동 생략(강제하려면 `--build`).
- 어떤 실게이트든 실패하면 exit 1. `--base` 없이 실행하면 오프라인 게이트만 통과 후 "ROUTE-HEALTH: NOT RUN" 다음 단계 안내를 출력(절반만 돈 걸 완료로 착각 방지).
- 지표 검증만 별도로: `$env:PYTHONUTF8='1'; python scripts\verify_metrics.py`. 스토어/TWA 제출 경로 체크리스트는 `docs/ornscore-store-release-preflight-2026-07-12.md`.

---

## 1. 빠른 시작 (5분)

```bash
# 1. 의존성 설치
pnpm install        # or npm install / yarn install

# 2. 환경변수 (DB 없이 더미만 보려면 .env 생략 가능)
cp .env.example .env

# 3. 개발 서버
pnpm dev
# → http://localhost:3000
```

이 단계에서 동작하는 페이지:
- `/` — 메인 (큐레이션 5개 테마 카드 + 인사이트 + 시세 바)
- `/theme/battery` — 2차전지 테마 상세 (레이더 차트 + 종목 리스트)
- `/theme/semi-materials` — 반도체 소재
- `/theme/bio` — 바이오
- `/theme/shipbuilding` — 조선
- `/theme/robot` — 로봇

---

## 2. PostgreSQL + 시드 적재 (실데이터 연결)

```bash
# Docker로 로컬 PG 띄우기
docker run --name vm-pg -e POSTGRES_USER=valuemap \
  -e POSTGRES_PASSWORD=valuemap -e POSTGRES_DB=valuemap \
  -p 5432:5432 -d postgres:16

# 스키마 푸시
pnpm db:push

# (또는 03_schema.sql 직접 실행)
psql postgresql://valuemap:valuemap@localhost:5432/valuemap -f ../03_schema.sql

# 테마 시드 312개 import (02_theme_seed.xlsx 필요)
pnpm seed:themes

# Prisma Studio로 데이터 확인
pnpm db:studio
```

---

## 3. DART API 연결

1. https://opendart.fss.or.kr/ 에서 무료 API 키 발급 (5분)
2. `.env`의 `DART_API_KEY=` 에 붙여넣기
3. 브라우저: `http://localhost:3000/api/dart?bgnDe=20260520&endDe=20260528`
   → 해당 기간 전체 공시 목록 JSON 반환

`src/lib/dart.ts`에 핵심 메서드 3개:
- `listDisclosures()` — 공시 목록
- `getCompanyOverview()` — 기업 개황
- `disclosureViewerUrl()` — DART 뷰어 URL

---

## 4. KIS Developers (시세) 연결

1. https://apiportal.koreainvestment.com/ 가입 후 앱 키/시크릿 발급
2. `.env`의 `KIS_APP_KEY`, `KIS_APP_SECRET` 에 입력
3. OAuth 토큰 갱신 → 일봉 시세 수집 → `daily_prices` 적재

TODO: `src/lib/kis.ts` 작성 (PoC 단계엔 스텁만, 운영 단계에 구현).

---

## 5. 자체 지표 계산 (`src/lib/metrics.ts`)

4종 모두 0~100 정규화. 100에 가까울수록 "지금 매수 매력적".

| 지표 | 입력 | 의미 |
|---|---|---|
| `momentumScore` | 일봉 종가 | 1M:3M:6M = 0.4:0.3:0.3 가중 수익률 |
| `flowScore` | 외국인·연기금 순매수 합계 / 시총 | 스마트머니 유입 |
| `valueScore` | PER / PBR vs 동일 테마 평균 | 저평가 |
| `volAdjustedScore` | 일간 수익률 평균 / 표준편차 | 위험대비 수익 |
| `compositeScore` | 위 4종 가중 평균 | 종합 |
| `neglectScore` | 52주 최고가 대비 하락률 | 소외도 (주달 호환) |

```typescript
import { computeStockMetrics } from "@/lib/metrics";

const result = computeStockMetrics({
  prices: { closes: [/* 일봉 종가 252개 */] },
  fund: { per: 14.2, pbr: 1.85, dividendYield: 0.8 },
  peer: { peerPerAvg: 18.5, peerPbrAvg: 2.4 },
  flow: { foreignNetSum: 285e8, pensionNetSum: 47e8, marketCap: 76e12 },
});
// → { momentum, flow, value, vol, neglect, composite }
```

---

## 6. 프로젝트 구조

```
04_poc_app/
├── README.md                  ← 본 파일
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example
├── prisma/
│   └── schema.prisma          ← Prisma 모델 (SQL 스키마의 TS 버전)
├── scripts/
│   └── seed-themes.ts         ← 02_theme_seed.xlsx 적재
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx           ← 메인 (큐레이션 5)
    │   ├── theme/[slug]/page.tsx ← 테마 상세
    │   └── api/
    │       ├── dart/route.ts  ← DART 프록시
    │       └── themes/route.ts
    ├── components/
    │   └── ThemeCard.tsx
    └── lib/
        ├── db.ts              ← Prisma 싱글톤
        ├── dart.ts            ← DART API 클라이언트
        ├── metrics.ts         ← 자체 지표 4종 계산
        └── mockData.ts        ← 더미 데이터 (실데이터 전 폴백)
```

---

## 7. 다음 단계 체크리스트

- [ ] Postgres 연결 + `pnpm seed:themes`로 312개 테마 적재
- [ ] KIS Developers 가입 + `src/lib/kis.ts` 작성 (일봉 수집)
- [ ] ETL 잡 1: 매일 15:40 `fetch_kr_prices` → daily_prices
- [ ] ETL 잡 2: 매일 16:00 `compute_metrics` → daily_stock_metrics / daily_theme_metrics
- [ ] 메인 페이지 더미 → 실데이터 교체 (`mockData.ts` 호출을 `db.dailyThemeMetric.findMany()`로)
- [ ] NextAuth 추가 (네이버·카카오·구글 OAuth)
- [ ] 종목 상세 페이지 작성 (`/stock/[ticker]`)
- [ ] 백테스트 페이지 (`/backtest`) — Pro 기능
- [ ] AI 분석 통합 (Claude/GPT API)
- [ ] 카카오 알림톡 발송 (관심테마 지표 트리거)

---

## 8. 배포 권장 스택

| 컴포넌트 | 추천 | 비�