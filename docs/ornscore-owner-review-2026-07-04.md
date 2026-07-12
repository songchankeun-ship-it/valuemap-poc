# 오른스코어 오너 리뷰 패키지 — 자동화 배치 178~198 (2026-07-04)

> **목적**: 오너가 최근 완료된 자동화 배치(Task 178~198)를 한 번에 리뷰하고, ① 무엇이 바뀌었는지 ② 무엇을 손으로 확인해야 하는지 ③ 남은 출시 리스크 ④ 한국어 무료 베타 go/no-go를 한 화면에서 판단하도록 정리한다.
> **성격**: 이 문서는 **문서 전용·소스 무변경**. 새 기능·리팩터링·데이터/산식 변경 0. 근거는 전부 레포 내부(`docs/AI_HANDOFF.md`·`docs/ornscore-spec-coverage.md`·`PROGRESS.md`·커밋 해시)에서만 인용하며, **이미 다른 문서에 있는 내용은 재서술 대신 링크**한다.
> **타임라인 연속성**: 배치 144~165는 [`ornscore-owner-review-2026-07-03.md`](./ornscore-owner-review-2026-07-03.md)(Task 166), 167~176는 [`ornscore-local-release-evidence-2026-07-03.md`](./ornscore-local-release-evidence-2026-07-03.md)(Task 177 (b)절)에서 이미 종합됨 → 여기서 재서술하지 않는다. 이 문서는 **그 이후 = 178~198**만 다룬다.
> **불변식 재확인**: 무료·한국어 전용 베타·138종목·비자문·확정가/Pro 비홍보 — 이번 배치 전 구간 유지. 금칙어(매수·매도·추천·수익 보장·목표가) 신규 도입 0.

---

## §1. 이번 배치 요약 (Task 178~198)

한 줄 변경 요약. 상세 근거는 각 행의 `근거` 문서/커밋을 참조(중복 서술 없음). 이 구간의 실제 작업 태스크는 **178·189·190·191·192·193·195·196·197·198** (179~188·194는 미사용 번호, 194는 본 리뷰 태스크). 성격은 **한국어 우선 카피·메타데이터 하드닝·회복 탄력적 폴백·유니버스 무결성 가드·스모크/관찰성 게이트 강화**이며 점수식·`stocks.json`·`direction`·인증·알림 배선·의존성은 전 구간 무변경.

### A. 개인화·리텐션 (retention loop)

| Task | 성격 | 한 줄 변경 | 근거 |
|---|---|---|---|
| 196 | source | 저장·최근 본 종목 재방문 큐 — `recentViews.viewedAt` 타입 버그(string→number) 교정 + 공통 `fmtRelativeTime` 유틸 통일 + 홈 `MyStocksSection` "최근 본 · N분 전" 표시 | 커밋 `4401596` · `AI_HANDOFF`/spec §2 8.2 |

### B. 탐색·비교·공시 UX

| Task | 성격 | 한 줄 변경 | 근거 |
|---|---|---|---|
| 195 | source | 유니버스 무결성 가드 — `verify_metrics.py`에 중복 티커/종목명·필수 필드 결측 검출 additive + `/universe` `검증보류` pill·`기타(미분류)`·빈 상태 패널(문구·CSS만) | 커밋 `a352f66` · spec §O |

### C. 신뢰·데이터·재무 문구

| Task | 성격 | 한 줄 변경 | 근거 |
|---|---|---|---|
| 189 | source | 한국어 우선 카피 정리 — 혼재 언어/유휴 토글 0 확인 + 지표 라벨 캐논 정렬(추세·거래활성도·밸류·위험조정) Fix-now 7건(레이더·meta·OG·내부 SORT 라벨) | 커밋 `8065e25` · `ornscore-korean-first-copy-cleanup-2026-07-03.md` |
| 197 | source(copy) | 투자 초보자 교육·주의 카드 명료화 — `priorityScoreCardCopy.confidenceGloss` 신설(필수 데이터·이상값 점검·점검 중 풀이) + `beginnerReadingCopy.disclaimer` "점수↑=탐색 우선순위(수익 보장 아님)" 절 추가 | 커밋 `007ceba` · `AI_HANDOFF` Task 197 |

### D. 로그인·모바일·접근성

| Task | 성격 | 한 줄 변경 | 근거 |
|---|---|---|---|
| 192 | source | 에러 바운더리·오프라인 재시도 폴백 — `app/error.tsx`·`app/global-error.tsx`(빈 화면 방지)·`OfflineContent` 재시도 버튼·`i18n.errorCopy`/`offlineCopy.retryButton` 신규(금칙어 0) | 커밋 `70c460e` · `AI_HANDOFF` Task 192 |
| 198 | docs-only | 모바일 뷰포트 후속 감사(360/390px·6라우트·5결함 클래스) → 넓은 표·탭타깃·CLS·safe-area 이미 정상 → **소스 무변경**. 유일 발견(`StockTabs` sticky top:0 헤더 겹침)은 실기기 의존 → owner⑤ 게이트 | 커밋 `ca0998c` · `ornscore-mobile-viewport-followup-2026-07-04.md` |

### E. QA·게이트·메타데이터 (계획·관찰성 강화)

| Task | 성격 | 한 줄 변경 | 근거 |
|---|---|---|---|
| 178 | docs-only | 다음 제품 베팅 숏리스트 — 폴리시 웨이브(167~177) 이후 "한 단계 큰 방향" 6개를 사용자 가치×차별성÷오너 게이트로 랭크(근시일 ③ 큐 대체 아님·참고 레이어) | 커밋 `f5f22a6` · `ornscore-next-product-bets-2026-07-03.md` |
| 190 | source | 검색 미리보기·페이지 메타데이터 하드닝 — 공개 페이지 title/description/OG·Twitter/canonical/robots 일관화 + **OG 이미지 상속 끊김 회귀 수정**(`images:["/opengraph-image"]` 재부여, 신규 에셋 0) | 커밋 `fe3b8e5` · `AI_HANDOFF` Task 190 |
| 191 | docs+1줄 | 로컬 출시 관찰성 체크리스트 — 라우트 이름·모니터링 액션·헬스 신호(`selfCheck`)·수동 리뷰 4절 + `/admin/status` 푸터 링크 1줄 | 커밋 `4d89069` · `ornscore-launch-observability-checklist.md` |
| 193 | source+docs | 로컬 스모크 커버리지 확장 — `--all` 12→23 라우트(공개 7·부정/폴백 2·비로그인 2, optional `expectStatus` additive) + 소프트 404 문서화. **기본 게이트 유한 7 무변경** | 커밋 `d9c5bbf` · `ornscore-route-smoke-checklist.md` |

> 성격 요약: 이 배치는 **표시·문구·메타데이터·i18n·폴백·게이트/스크립트**가 중심이며, 실질 코드 교정은 (a) Task 196 `recentViews.viewedAt` 타입 버그, (b) Task 190 OG 이미지 상속 회귀 2건뿐. 나머지는 카피/메타데이터/문서/스모크·무결성 가드다. 점수식·`stocks.json`·`direction`·인증·`metricsVersion`은 **전 구간 무변경**.

---

## §2. 무엇을 수동 검증하나 — 도메인별 체크리스트 (9개 도메인)

각 항목: **현재 상태** + 이를 증명하는 **검증(명령 / `file:line` / task / 스모크 앵커 / 문서)**. 체크박스는 오너가 직접 확인 후 체크. 도메인 레이아웃은 [`ornscore-local-release-evidence-2026-07-03.md`](./ornscore-local-release-evidence-2026-07-03.md) (f)절 9도메인을 재사용하고, 이번 배치(178~198) 근거로 갱신했다.

### 1. 모바일 (mobile)
- [ ] 360/390px 6라우트(home·today·stocks·stock상세·compare·login)+공용 크롬 5결함 클래스(헤더겹침·넘침·밀집·44px·CLS) 감사 완료 → 넓은 표 `overflow-x-auto`·탭타깃 44px·safe-area 오프셋 이미 정상 — 근거 **Task 198**(`ornscore-mobile-viewport-followup-2026-07-04.md`). 소스 무변경(불필요 churn 회피).
- [ ] `StockTabs.tsx:53` 탭 바 `sticky top-0`가 앱 헤더와 겹치는 저심각 발견은 **owner⑤ 게이트**(정확 오프셋=헤더높이+`env(safe-area-inset-top)`, 실기기 의존) — 근거 Task 198 "owner 게이트". 실 브라우저 390px 픽셀 육안은 여전히 운영자.

### 2. 데스크톱 (desktop)
- [ ] `--all` 23라우트 SSR 200·치명 마커 0·앵커 존재 — 확인: `npm run smoke:check -- --base http://localhost:4455 --all`(로컬 prod 기동 후, 23/23 OK·exit 0). 기본 게이트는 7/7 유한.
- [ ] 공개 페이지 검색 미리보기(OG·Twitter·canonical) 데스크톱 공유 시 브랜드 카드 유지 — 근거 **Task 190**(OG 상속 회귀 수정) + 2026-07-12 정적 공유 이미지. 확인: `/about`·`/pricing` SSR `<head>` `og:image=/social/ornscore-og-1200x630.jpg`.

### 3. 로그인 (login)
- [ ] `/login` SSR 기본 한국어·제공자(카카오·구글·네이버·이메일) 렌더·noindex — 근거 **Task 190**(서버 래퍼+`LoginContent` 분할·robots noindex). 확인: `smoke:check`의 `/login` 앵커 / 실 OAuth 왕복은 **운영자 게이트**.
- [ ] 예외·오프라인 시 로그인 흐름이 빈 화면 대신 재시도 카드로 degrade — 근거 **Task 192**(`error.tsx`·`OfflineContent` 재시도). 확인: `/offline` SSR 한국어+`다시 시도` 버튼.

### 4. 관심 (watchlist)
- [ ] 최근 본 종목 재방문 큐 "최근 본 · N분 전" 표시(홈 `MyStocksSection`)·상대시각 단일 소스 — 근거 **Task 196**(`recentViews`/`fmtRelativeTime`). 확인: `smoke:check`의 `/watchlist`·`/history` 앵커.
- [ ] `recentViews.viewedAt` 타입 교정으로 형식 깨짐/레거시 ISO 항목 graceful 드롭 — 근거 Task 196(`recentViews.ts`). 그룹·메모·CSV는 **신규 기능(④) 잔여** — spec §2 8.2.

### 5. 비교 (compare)
- [ ] `/compare` `--all` 스모크 200·SSR 렌더 — 확인: `smoke:check -- --all`(Task 193으로 `/compare` 등 확장 세트 포함). 바스켓 관리·5초 실행취소는 이전 배치(Task 158, owner-review 07-03) 유지.
- [ ] 업종=내부 분류 각주·비교 기준 캡션 정합(무변경 확인) — 근거 spec §1 F.

### 6. 공시 (disclosures)
- [ ] `/disclosures` SSR 렌더·"최신 200건 내" 기준 표기 유지 — 확인: `smoke:check`의 `/disclosures` 앵커 `공시`.
- [ ] `/universe`(분석 대상) `검증보류` pill·`기타(미분류)`·빈 상태 "데이터 준비 중" 패널 — 근거 **Task 195**(`universe/page.tsx` 표시 하드닝, CSS/문구만). 확인: `smoke:check -- --all`의 `/universe` 앵커.

### 7. 종목 상세 (stock detail)
- [ ] 초보자 교육·주의 카드 — `필수 데이터·이상값 점검·점검 중` 풀이 1줄 + "점수↑=탐색 우선순위(수익 보장 아님)" — 근거 **Task 197**(`priorityScoreCardCopy.confidenceGloss`·`beginnerReadingCopy.disclaimer`). 확인: `/stock/005930`(정상)·`/stock/247540`(suspect) SSR 풀이 렌더.
- [ ] 백분위/순위('상위 X%') 블록 SSR 렌더 — 확인: `smoke:check`의 `/stock/034730` 앵커 `상위`.

### 8. 성능 (performance)
- [ ] 스모크 게이트가 라우트 200·치명 마커 0을 **진짜 게이트**(exit 1)로 검증 — 근거 **Task 193**(23라우트 커버리지·소프트 404 문서화). 확인: `npm run smoke:check -- --all`.
- [ ] 로컬 관찰성 참고표(라우트 이름·헬스 신호 `selfCheck`·수동 리뷰 단계)로 노출 후 자가 점검 — 근거 **Task 191**(`ornscore-launch-observability-checklist.md`). `perf:check`는 권고(절대 ms는 상대 회귀만 의미·항상 exit 0).

### 9. 재무 문구 (finance wording)
- [ ] 지표 라벨 캐논(추세·거래활성도·밸류·위험조정) 페이지 간 정렬·혼재 언어 누수 0 — 근거 **Task 189**(`ornscore-korean-first-copy-cleanup-2026-07-03.md`). 확인: 홈 SSR `html lang="ko"`·`hreflang`/`lang=en` 0.
- [ ] 금칙어(매수·매도·추천·수익 보장·목표가) 신규 0·확정가 0·에러/오프라인 카피도 중립 시스템 안내만 — 확인: `python scripts/verify_metrics.py`(금칙어 0·Metrics 2.4). Task 192·197 신규 카피 포함 게이트 통과.

---

## §3. go/no-go 판단 (한국어 무료 베타)

외부 노출은 "완벽 배포"가 아니라 "안전하게 남에게 보여줄 수 있는 상태"인지를 묻는다. [`ornscore-local-release-evidence-2026-07-03.md`](./ornscore-local-release-evidence-2026-07-03.md) (a)절 3축 프레임을 이번 배치 기준으로 재확인한다.

| 축 | 질문 | 자동으로 닫히나 | 이번 배치(178~198) 판단 |
|---|---|---|---|
| **A. 치명 결함 없음** | 전 핵심 라우트 200·치명 마커 0·산식 정합·금칙어 0·유니버스 무결성 | ✅ 로컬 게이트로 닫힘 | **GO** — §4 게이트 통과, 스모크 23/23(기본 7/7), Task 195 무결성 가드 additive 통과(중복/결측 0) |
| **B. 문구·불변식 안전** | 비자문 고지·무료 베타·확정가 0·방향성 표현 제거·한국어 우선·에러/폴백 카피 중립 | ✅ 게이트+감사로 닫힘 | **GO** — Task 189 한국어 감사(혼재 0)·197 교육 카피 정합·192 폴백 카피 금칙 0 |
| **C. 실기기·시각·법무** | 실 브라우저 390px 육안·OAuth 실 왕복·결제/약관 | ❌ Playwright 미구성·유료계정·법무 = 자동 불가 | **오너 게이트** — §4 참조. `StockTabs` sticky 오프셋(Task 198)·EN 토글 실확인도 여기 |

**결론(로컬 근거 기준)**: **A·B는 로컬에서 GO**. 남은 것은 C의 "사람만 할 수 있는" 잔여(실기기 픽셀·OAuth 왕복·결제/법무)뿐이며 이는 *코드 결함이 아니라 게이트 부재/사업 결정*이다.

- **비파괴적 외부/베타 노출은 지금 GO** — 전문가 리뷰·소규모 한국어 베타에 보여줄 수 있는 상태다.
- **정식 스토어 출시 + 결제 오픈은 여전히 오너 결정 뒤**(§4의 ④/⑤ 게이트 선결). 이 배치는 그 경계를 옮기지 않았다.

> 이 문서 작성 시점 재현: `tsc --noEmit` exit 0 · `verify_metrics.py` 138종목·오류 0·금칙어 0·Metrics 2.4. 문서 전용 변경이라 build/smoke/perf는 직전 QA(Task 193 §게이트, `--all` 23/23) 결과와 동일하게 유효.

---

## §4. 남은 출시 리스크 + 오너·법무 게이트

전부 `docs/ornscore-spec-coverage.md`에 **이미 태깅된 항목만** — 신규 리스크 제기 아님. 재서술하지 않고 **원본 문서로 링크만** 건다.

### 큰 제품/데이터 의사결정 (④ — 추적 중, 자동화 큐 단독으로 닫지 않음)
- 백테스트 생존편향 실해결 / KRX 공식 업종코드 매핑 / 관리자 데이터 상태판·오류 신고 저장소 / 점수 히스토리·급변 알림 라이브화 / 공시 전체 기간 수집 파이프라인 / 종목 커버리지 138→500→전체 / 결제·구독·권한 게이트 → `docs/ornscore-spec-coverage.md` §B 7~15 · §C 16~18.
- "다음 한 단계 큰 방향" 베팅 랭킹(참고 레이어) → [`ornscore-next-product-bets-2026-07-03.md`](./ornscore-next-product-bets-2026-07-03.md) (Task 178).

### 사람/법무/사업 확인 (⑤ — 코드로 대신 불가)
- **오너 최종 체크리스트** → [`ornscore-owner-final-checklist.md`](./ornscore-owner-final-checklist.md)
- **앱 패키징/스토어 준비도**(계정·서명 지문·실기기 QA·에셋) → [`app-packaging-readiness.md`](./app-packaging-readiness.md)
- **결제/약관/데이터 소스 법무**(약관 확정·환불/청약철회·상용 데이터 라이선스·AI 고지) → [`legal-ai-commercial-readiness.md`](./legal-ai-commercial-readiness.md) · [`data-source-commercial-risk.md`](./data-source-commercial-risk.md)
- **카카오톡 실발송 오너 입력값**(채널·발신프로필·템플릿 심사·건당 과금) → [`ornscore-kakaotalk-alert-backlog.md`](./ornscore-kakaotalk-alert-backlog.md) §4
- **실기기·시각 게이트**(390px 육안·OAuth 왕복·`StockTabs` sticky 오프셋 실검) → owner⑤, 근거 Task 198 · `ornscore-post-release-qa-2026-07-02.md` §7·§8.

---

*작성: 2026-07-04 (Task 194, Claude). 문서 전용·소스 무변경. 로컬 커밋만 · 푸시/릴리스/외부 발행은 오너.*
