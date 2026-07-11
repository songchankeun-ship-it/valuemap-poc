# ORNScore SEO Keyword Map - 2026-07-12

## 목적

웹사이트 공개 이후 자연 검색 유입을 만들기 위한 페이지별 검색 의도 맵이다. Google은 `meta keywords`를 핵심 랭킹 신호로 보지 않으므로, 키워드는 제목·설명·본문·내부 링크·구조화 데이터·Search Console 운영으로 반영한다.

공식 기준:
- SEO 기본: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- 제목 링크: https://developers.google.com/search/docs/appearance/title-link
- 설명 스니펫: https://developers.google.com/search/docs/appearance/snippet
- 구조화 데이터: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data

## 핵심 키워드 클러스터

| 우선순위 | 검색 의도 | 후보 키워드 | 대응 페이지 | 현재 상태 | 다음 작업 |
|---|---|---|---|---|---|
| P0 | 브랜드/직접 탐색 | 오른스코어, ornscore, 오른스코어 주식 | `/`, `/about` | 배포됨 | Search Console 등록 후 브랜드 쿼리 노출 확인 |
| P0 | 한국 주식 탐색 도구 | 주식 종목 찾기, 주식 스크리닝, 한국 주식 분석, 코스피 종목 분석, 코스닥 종목 분석 | `/stocks`, `/` | 반영됨 | Search Console 노출 쿼리 확인 |
| P0 | 지표 기반 비교 | PER PBR ROE 비교, 저평가 주식 찾기, 배당 수익률 주식, 주식 지표 보는 법 | `/guide/metrics`, `/stocks`, `/stock/[ticker]` | FAQ 반영됨 | 실제 쿼리 기반 FAQ 보강 |
| P0 | 공시 읽기 | DART 공시 분석, 자사주 취득 공시, 주요주주 보유변동, 전환사채 공시, 유상증자 공시 | `/disclosures`, `/stock/[ticker]` | 유형 안내 반영됨 | 실제 쿼리 기반 앵커 보강 |
| P1 | 테마 탐색 | 2차전지 관련주, 반도체 관련주, 조선 관련주, 바이오 관련주, 로봇 관련주 | `/theme/[slug]`, `/stocks?theme=` | 메타/본문/sitemap 반영됨 | 실제 데이터 기반 테마 랜딩 확장 후보 |
| P1 | 검증/신뢰 | 주식 데이터 기준일, 주식 데이터 출처, DART KRX 데이터 확인 | `/status`, `/about` | 메타 반영됨 | `/status` Search Console 색인 요청 |
| P1 | 백테스트/검증 | 주식 백테스트, 투자 전략 검증, MDD Sharpe 백테스트 | `/backtest` | `nosnippet` 유지 | 교육형 설명은 유지하되 추천처럼 보이는 문구 금지 |

## 페이지별 역할

## 2026-07-12 반영 상태

이번 후속 슬라이스에서 아래 항목을 코드에 반영했다.

- 공통 키워드 클러스터를 `src/lib/seoKeywords.ts`로 분리했다.
- `/`, `/stocks`, `/compare`, `/guide/metrics`, `/disclosures`, `/theme/[slug]`, `/status`, `/about`의 title/description/keywords를 페이지 역할별로 보강했다.
- `/stocks`에 주식 스크리닝, 종목 검색, PER/PBR/ROE 비교, 저평가 주식, 배당수익률, 코스피·코스닥 분석 의도를 보이는 문장으로 추가했다.
- `/guide/metrics`에 PER/PBR/ROE/배당수익률/위험조정 FAQ와 FAQPage JSON-LD를 추가했다.
- `/disclosures`에 DART 공시 유형별 확인 포인트를 추가했다.
- `/theme/[slug]`에 관련주/테마주 alias를 메타 설명과 본문에 반영했다.

아직 남은 핵심은 Search Console 등록, sitemap 제출, URL 색인 요청, 실제 노출 쿼리 기반 제목/설명 조정이다.

### `/`

역할: 브랜드 + "한국 주식 탐색 도구" 첫 진입.

집중 키워드:
- 오른스코어
- 한국 주식 탐색
- 주식 종목 찾기
- 주식 스크리닝
- PER PBR ROE 공시 한 화면

주의: 매수·추천·급등주 같은 문구로 유입을 끌지 않는다.

### `/stocks`

역할: 실제 검색/필터가 가능한 종목 탐색 랜딩.

집중 키워드:
- 주식 스크리닝
- 종목 검색
- PER PBR ROE 비교
- 저평가 주식 찾기
- 코스피 코스닥 종목 분석

반영됨:
- "주식 스크리닝, 종목 검색, PER/PBR/ROE 비교, 저평가 주식 찾기, 배당수익률 높은 주식, 코스피·코스닥 종목 분석" 문맥 추가.

### `/guide/metrics`

역할: 초보자/검색 유입용 교육 페이지.

집중 키워드:
- 주식 지표 보는 법
- PER PBR ROE 뜻
- 주식 점수 산식
- 위험조정 지표
- 거래활성도 지표

반영됨:
- FAQ 5개: PER, PBR, ROE, 배당수익률, 위험조정.
- FAQPage JSON-LD.

### `/disclosures`

역할: 공시 신호 탐색.

집중 키워드:
- DART 공시 분석
- 자사주 취득 공시
- 주요주주 보유변동
- 전환사채 공시
- 유상증자 공시

반영됨:
- 공시 유형별 상단 안내: 자사주 취득·자기주식 처분, 임원·주요주주 보유변동, 정정공시, 단일판매·공급계약, 전환사채·유상증자.

### `/theme/[slug]`

역할: 테마성 검색 유입.

집중 키워드:
- 2차전지 관련주
- 반도체 관련주
- 바이오 관련주
- 조선 관련주
- 로봇 관련주

이번 변경:
- `sitemap.xml`에 `/theme/{slug}`를 포함해 검색엔진 발견 경로를 보강했다.

주의:
- 관련주 페이지는 투자 추천처럼 보이면 리스크가 커진다. "테마 분류와 데이터 비교" 톤을 유지한다.

## Search Console 출시 체크

Owner-only:
1. `https://ornscore.com` 속성 등록.
2. `https://ornscore.com/sitemap.xml` 제출.
3. URL 검사 후 색인 요청:
   - `/`
   - `/stocks`
   - `/guide/metrics`
   - `/disclosures`
   - `/status`
   - `/theme/battery`
   - 상위 종목 상세 5개: `/stock/005930`, `/stock/000660`, `/stock/042700`, `/stock/034730`, `/stock/035720`
4. 1~2주 뒤 검색어 보고서에서 노출 쿼리 확인.

## 다음 자동화 후보

1. `/guide/metrics` FAQ 섹션 추가.
2. `/disclosures` 공시 유형별 설명 앵커 추가.
3. `/theme/[slug]`를 mock 테마 중심에서 real-data 테마 랜딩으로 확장.
4. Search Console에서 실제 노출 쿼리 확보 후 제목/설명 조정.
