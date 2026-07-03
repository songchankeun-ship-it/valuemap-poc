# 오른스코어 한국어 우선 카피 정리 감사 (Task 189)

> 무료 한국어 베타(v1) 공개 표면을 대상으로 (1) 혼재 언어 UI, (2) 유휴 언어 컨트롤, (3) 지표 용어 드리프트,
> (4) 첫 방문자 문구 어색함을 감사하고, 안전한 소규모 카피 수정만 적용한다.
> 근거 결정: `docs/ornscore-free-beta-v1-scope.md` §3~4 (한국어 전용 공개 경험 · EN 문자열은 내부 보존).
>
> 작성: 2026-07-03 (AI Center Task 189, Developer AI). 기준 커밋 브랜치 `ai-center/task-189-ornscore-korean-first-launch-copy-cl`.
> 톤 규칙: 후보·탐색·확인 · 매수/매도/추천/목표가/수익 보장 신규 표현 0.

## 기준선 (편집 전 게이트)

- `npx tsc --noEmit` → 0 errors.
- `verify_metrics.py` → 검사 138종목 · 오류 0건 / 금칙어 0건 / 산식 버전 Metrics 2.4 일치.
- 크래시 런(157, codex)은 `docs/AI_HANDOFF.md` 자동 헤더만 갱신 → 부분 코드 편집 없음(안전).

---

## 1. 유휴 언어 컨트롤 (KO/EN 토글) — 확인만, 삭제 금지

**결론: 이미 숨김 처리됨 · EN 데이터 보존됨. 추가 조치 불필요(현 상태 유지).**

- `grep -rn "LanguageSwitcher" src/` → **`src/components/LanguageSwitcher.tsx` 정의 1건뿐, import(사용처) 0건.** 과거 scope 문서 §3에 기록된 `AppHeader.tsx:84`·`MobileNav.tsx` 렌더는 선행 작업에서 이미 제거됨(현재 두 파일 모두 `LanguageSwitcher`·`lang=`·`hreflang` 참조 0).
- `src/lib/i18n.ts:4` `DEFAULT_LOCALE = "ko"`, `LanguageProvider.tsx:55` `useState<Locale>(DEFAULT_LOCALE)` → 기본 로케일 한국어 고정.
- **의도적으로 숨김 · EN i18n/`copy/*.ts` en 키는 추후 재개 대비 보존.** 컴포넌트·EN 문자열 삭제하지 않음.

## 2. 혼재 언어 UI 누수 — 감사

**결론: 진짜 누수 0건.** 공개 SSR/상시 컴포넌트의 사용자 노출 카피는 모두 로케일 인지 copy 모듈에서 온다. 아래는 라틴 문자가 보이지만 **누수 아님**으로 분류:

| 위치 | 문자열 | 분류 |
|---|---|---|
| `components/home/HowItWorksSection.tsx:13,32` · `BeginnerReading.tsx:30` | `STEP 1/2/3` 배지 | **의도적 디자인 토큰**(Task 60 P0-2, spec-coverage §8 P0-2·P0-2 재검증). 스타일 번호 배지 → 유지 |
| 전역 | `OrnScore`/`오른스코어`, 티커, `PER·PBR·ROE·DART·KRX·MDD·Sharpe·CB` | 브랜드·금융 약어 → 유지 |

`loading.tsx`·`not-found.tsx`·`offline`·`WelcomeToast`·`WelcomeOnboarding`·홈 빈 상태 전수 확인 → 하드코딩 영어 문장 카피 0.

## 3. 지표 용어 드리프트 — 감사

캐논 4지표 라벨: **추세 · 거래활성도 · 밸류 · 위험조정.** 구용어(모멘텀·자금흐름·변동성조정)의 사용자 노출 단독 표기를 정렬한다.
의도적 글로서리 브리지("추세 (모멘텀)" 등)는 학습 보조이므로 **유지**한다.

### Fix-now (사용자 노출 단독 구용어 → 캐논)

| # | 위치 | 현재 | 수정 |
|---|---|---|---|
| 1 | `app/theme/[slug]/page.tsx:191` | 레이더 라벨 `모멘텀` | `추세` |
| 2 | `app/theme/[slug]/page.tsx:200` | 레이더 라벨 `변동성` | `위험조정` |
| 3 | `app/page.tsx:87` | meta desc `모멘텀·거래활성도·밸류에이션·변동성` | `추세·거래활성도·밸류·위험조정` |
| 4 | `app/page.tsx:92` | OG desc `모멘텀·거래활성도·밸류에이션·변동성·공시` | `추세·거래활성도·밸류·위험조정·공시` |
| 5 | `app/stock/[ticker]/page.tsx:64` | meta `모멘텀 … · 변동성조정 …` | `추세 … · 위험조정 …` |
| 6 | `app/stock/[ticker]/page.tsx:242` | OG(Article) 동일 | `추세 … · 위험조정 …` |
| 7 | `mockStockPool.ts:108,110` | 내부 `SORT_OPTIONS.label` `모멘텀 높은순`·`변동성조정 높은순` | `추세 높은순`·`위험조정 높은순`(내부 일관성) |

- `app/page.tsx:88` `keywords` 배열의 `모멘텀`·`밸류에이션`은 **SEO 키워드 → 유지**(설명 산문만 캐논 정렬).
- #7 `SORT_OPTIONS.label`은 실제로 `SortKey` 타입 파생(`mockStockPool.ts:124`)에만 쓰이고 렌더되지 않음. 실 노출 정렬 라벨은 `copy/stocks.ts:66` `추세 높은순`(이미 캐논). 내부 문자열이나 혼동 방지 위해 함께 정렬.

### Keep (의도적 브리지 / 비노출 / 내부 코드)

| 위치 | 사유 |
|---|---|
| `copy/metricsGuide.ts:103,133,184,187` · `copy/stocks.ts:262,267` | 글로서리 브리지 "추세 (모멘텀)"·"위험조정 (변동성조정)" → 유지 |
| `about/page.tsx:28,31` | 교육용 브리지 "모멘텀(추세) … 변동성조정(위험 대비)" → 유지 |
| `backtest/page.tsx:58,59` | 전략 설명 자체가 브리지 "모멘텀 점수 … (추세 추종)"·"변동성조정 점수 … (위험조정)" → 유지 |
| `components/ScoreTooltip.tsx:18,23,41` | **미사용 컴포넌트**(import 0·`kind=` 사용처 0). 렌더 안 됨 → 비노출, 손대지 않음 |
| `lib/prompts/theme-insight.ts`·`stock-analysis.ts` | AI 프롬프트 내부(AI 공개 숨김) → 유지 |
| `lib/metrics.ts:28,85` | 코드 주석 → 유지 |

## 4. 첫 방문자 문구 어색함 — 감사

**결론: 어색/모호/톤 위반 0건.** `home/HomeHero.tsx`·`home/HowItWorksSection.tsx`·`WelcomeOnboarding.tsx`·`WelcomeToast.tsx`·주요 빈 상태의 한국어 문구는 자연스럽고 보수적 톤 유지(매수/매도/추천/목표가/수익 보장 0). 폴리시할 항목 없음.

---

## 적용 요약

- **Fix-now 7건**(모두 §3 지표 드리프트) 적용. copy 파일 변경 시 en 키 패리티 동시 반영(`satisfies Record<Locale>` 유지).
- 점수식·`public/data/*`·cron·auth·`direction`·반응형 클래스 무변경.
- **Defer**: §1 유휴 토글은 현 상태(숨김+EN 보존)가 오너 결정과 정합 → 조치 없음. ScoreTooltip 미사용 컴포넌트 정리는 별도 판단(이번 스코프 외).
