# 오른스코어(OrnScore) v1 제품 방향 잠금 — 무료 한국어 베타 (Free Beta v1 Decision Lock)

> 이 문서 하나만 읽으면 v1 범위를 알 수 있어야 한다.
> **v1 = 무료 · 한국어 전용 · 138종목 · AI 분석 공개 숨김 · 알림 로드맵은 카카오톡 방향 · 앱스토어는 추후 목표.**
> 작성: 2026-06-30 (AI Center task 113, [claude]). 후속 구현 전 방향 고정용 결정 기록.

오른스코어는 **무료 베타 단계의 한국 주식 탐색·데이터 도구**다. 투자자문·매수/매도 권유·유료 리서치·수익 보장이 아니다. 본 문서의 모든 문구는 이 보수적 톤을 유지한다.

---

## 1. 결정 요약 (Decision Summary)

오너 결정에 따라 다음을 v1 방향으로 **고정**한다. 이후 구현은 이 결정을 따른다.

- **무료(Free now).** 현재 서비스를 유료 또는 "곧 유료"로 포지셔닝하지 않는다. 공개 화면에서 유료 약속을 하지 않는다.
- **수익화는 내부 미래 옵션으로만.** 코드/문서에 수익화 구조를 남겨두되 **공개 약속으로 노출하지 않는다.**
- **알림 방향 = 카카오톡 우선(추후).** 실제 카카오톡 스타일 알림을 추후 선호한다. **이메일 알림을 제품의 메인 알림 경로로 포지셔닝하지 않는다.** 단, **로그인 매직링크 이메일은 계속 허용**한다.
- **AI 분석은 공개 우선 경험에서 숨긴다.** 코드는 (더 안전하면) 보존하되, **공개 진입점은 제거하거나 게이트**한다.
- **앱스토어 앱은 실제 추후 목표.** 로드맵/체크리스트는 유지하되, **이번 작업에서 스토어 제출 작업은 하지 않는다.**
- **영어는 당분간 제외.** **한국어 전용 공개 경험**이면 충분하다.
- **유니버스는 현행 138종목 유지.**
- 그 외에는 보수적 권고를 따른다: **데이터 신뢰 → 검색/탐색 → 모바일 사용성** 우선순위.

---

## 2. 오너 결정 (Owner Decisions, 원문)

- Go free for now. Do not present current service as paid or paid-soon.
- Keep monetization only as an internal future option, not a public promise.
- Notification direction: prefer real KakaoTalk-style notification later; do not position email alerts as the main product notification path. Login magic-link email is still allowed.
- Hide AI analysis from public-first experience for now. Keep code if safer, but remove or gate public entry points.
- App-store apps are a real target eventually; keep roadmap/checklist, but no store submission work in this task.
- Exclude English for now. Korean-only public experience is acceptable.
- Keep current universe at 138 stocks.
- For the rest, follow the conservative recommendation: data trust, search/exploration, mobile usability first.

---

## 3. 공개 표면 감사 (Public-Surface Audit)

task 113 시점 코드 기준. `file:line`은 감사 당시 위치(편집 시 재확인 필요).

| 영역 | 현재 위치 (file:line) | 현재 상태 | 결정과의 충돌 여부 |
| --- | --- | --- | --- |
| **요금제 1차 내비** | `src/components/Sidebar.tsx:15` (`/pricing`, group `""` = 1차) · `src/components/MobileBottomNav.tsx:21` (`/pricing`) | `/pricing`이 데스크톱 사이드바·모바일 하단탭 **1차 메뉴**에 노출 | ⚠️ **충돌 약함** — 무료 베타에서 요금제를 1차 내비로 강조하면 "유료/곧 유료" 인상. 강등 또는 더보기 이동 권장. |
| **요금제 카피(베타→Pro)** | `src/lib/copy/pricing.ts:204` (`bodyStrong3` "정식 출시 시 Pro 기능으로 전환될 수 있습니다") · `:225` (`compare.footer2b`) | 이미 "전환될 **수 있습니다** + 전환 전 사전 안내"로 보수화(task 110) | ✅ **정합** — 확정 가격·"곧 유료" 약속 없음. 톤 유지. 페이지 자체는 보존(법무 고지·waitlist). |
| **요금제 플랜 플래그** | `src/lib/features.ts:5,7` (`plannedPlan:"pro"`) · `:9` (`advancedAlerts` planned/pro) · `:11,13` (`proPlan`/`premiumPlan` `status:"planned"`) | 내부 플래그로 "Pro 전환 예정" 표시 | ✅ **내부 유지** — 공개 약속 아님(내부 future 옵션). 코드 보존. |
| **요금제 종목 수 문구** | `src/lib/pricing.ts:25` · `src/lib/copy/pricing.ts:67` ("138개 종목 탐색") | 138종목을 free 한도로 서술 | ✅ **정합** — 138 유지 결정과 일치. |
| **AI 분석 카드(상세)** | `src/app/stock/[ticker]/page.tsx:400` (`<AiAnalysisCard>`) · `src/components/AiAnalysisCard.tsx` | 종목 상세 하단에 AI 분석 카드 **공개 노출** | ⚠️ **충돌** — 공개 우선 경험에서 AI 숨김 결정과 충돌. 진입점 제거 또는 로그인/플래그 게이트 권장. |
| **AI 기록 내비(`/history`)** | `src/components/Sidebar.tsx:19` (더보기) · `src/components/MobileBottomNav.tsx:20` · `src/components/MobileNav.tsx` · i18n `src/lib/i18n.ts:44` ("분석 기록") | `/history`(AI 분석 기록)가 내비에 노출 | ⚠️ **충돌** — AI 공개 진입점. 내비에서 제거 또는 게이트 권장. |
| **AI API/페이지** | `src/app/api/ai/analyze/route.ts` · `src/app/history/page.tsx` · `src/lib/ai.ts`·`src/lib/ai-insight.ts` | AI 분석 API·기록 페이지·라이브러리 | ✅ **내부 유지** — 코드 보존(더 안전). 공개 진입점만 차단. |
| **알림: 이메일 vs 카카오** | `src/lib/alertCatalog.ts:85` ("이메일로 알려드려요") · `src/app/settings/notifications/page.tsx:127-128` ("지금은 이메일 알림 2종만 … 카카오 … 준비 중") · `src/lib/features.ts:5,7` (alert active/free) · `src/app/api/cron/notify/route.ts` | 현재 **이메일**이 실제 발송 채널, 카카오는 "준비 중"으로 명시 | ⚠️ **충돌 약함** — 설정 페이지는 이미 "이메일=현재/카카오=준비 중"으로 분리. 다만 이메일을 **메인 제품 알림**처럼 읽히는 문구(`alertCatalog.ts:85` 등)는 카카오 로드맵 방향으로 톤 조정 권장. 로그인 매직링크 이메일은 유지. |
| **KO/EN 토글** | `src/components/AppHeader.tsx:84` (`<LanguageSwitcher compact />`) · `src/components/MobileNav.tsx` · `src/components/LanguageSwitcher.tsx` | 헤더·모바일 드로어에 **언어 전환 토글 노출** | ⚠️ **충돌** — 한국어 전용 결정과 충돌. 토글 숨김 권장(EN i18n 데이터는 코드 보존). |
| **영어 지원 주장/문자열** | `src/lib/i18n.ts`(en 로케일 전체) · 다수 `copy/*.ts`의 en 키 | EN 문자열 다수 존재(클라 전환식) | ✅ **내부 유지** — 토글만 숨기면 공개 노출 안 됨. EN 문자열 삭제 불필요(추후 재개 대비). |
| **앱/PWA/스토어 로드맵** | `src/app/manifest.ts`(PWA) · `docs/app-roadmap.md` · `docs/app-packaging-readiness.md` · `docs/app-packaging-final-checklist.md` · `docs/app-store-submission-pack.md` | PWA manifest + 앱 패키징/스토어 문서 | ✅ **정합(로드맵 유지)** — 앱스토어는 추후 목표. 문서·manifest 유지, **이번 작업에서 제출 작업 없음.** |
| **138 유니버스 문구** | `src/app/layout.tsx:20,23,32` · `src/app/page.tsx:85,86` · `src/app/manifest.ts:15` · `src/app/not-found.tsx:13` · `src/app/opengraph-image.tsx:90` · `src/components/ScoreTooltip.tsx:36` 등 | "138개 종목"을 유니버스 크기로 서술 | ✅ **정합** — 138 유지 결정과 일치. 변경 불필요. |

범례: ✅ 정합/유지 · ⚠️ 충돌(공개 UI 조정 대상)

---

## 4. 구현 체크리스트 (Implementation Checklist)

> 이번 task 113은 **결정 잠금 + 매핑**만 한다. 아래 (i) 항목들은 **다음 작업의 후속 UI 변경**이며, 이번 커밋에서는 코드를 바꾸지 않는다(또는 아주 작고 명백히 안전한 것만). 각 항목은 파일 경로 + 안전 범위 1줄 노트.

### (i) Must-change public UI — 후속 작업에서 변경 (공개 UI)

1. **요금제 내비 강등** — `src/components/Sidebar.tsx:15`, `src/components/MobileBottomNav.tsx:21`.
   - how/safe: `/pricing`을 1차 메뉴에서 "더보기" 그룹으로 이동하거나 제거. 페이지(`/pricing`)·법무 고지·waitlist는 보존(라우트 삭제 아님, 내비 우선순위만).
2. **AI 분석 카드 공개 제거/게이트** — `src/app/stock/[ticker]/page.tsx:400` (`<AiAnalysisCard>`).
   - how/safe: 종목 상세에서 공개 렌더 제거하거나 로그인/`features.ts` 플래그 뒤로 게이트. `AiAnalysisCard.tsx`·API는 삭제 금지(코드 보존).
3. **`/history` AI 기록 내비 제거/게이트** — `src/components/Sidebar.tsx:19`, `src/components/MobileBottomNav.tsx:20`, `src/components/MobileNav.tsx`.
   - how/safe: 내비 항목 제거 또는 로그인 게이트. 라우트/페이지는 보존.
4. **KO/EN 토글 숨김** — `src/components/AppHeader.tsx:84`, `src/components/MobileNav.tsx`.
   - how/safe: `<LanguageSwitcher>` 렌더만 숨김(컴포넌트·i18n EN 데이터 보존). 기본 로케일 한국어 고정.
5. **이메일=메인 알림 문구 톤 조정** — `src/lib/alertCatalog.ts:85`, `src/app/settings/notifications/page.tsx:127-128`.
   - how/safe: 이메일을 제품 메인 알림처럼 강조하는 문구를 "현재는 이메일로 발송, 카카오톡 알림은 준비 중" 식 로드맵 톤으로. 로그인 매직링크 이메일 문구는 손대지 않음. 점수식·cron 동작 무변경.

### (ii) Keep-internal — 코드/문서 보존하되 공개 노출 안 함

- **AI 코드/라우트**: `src/app/api/ai/analyze/route.ts`, `src/components/AiAnalysisCard.tsx`, `src/app/history/page.tsx`, `src/lib/ai.ts`, `src/lib/ai-insight.ts` — 보존, 공개 진입점만 차단.
- **요금제 플랜 플래그**: `src/lib/features.ts`(`proPlan`/`premiumPlan`/`plannedPlan:"pro"`/`advancedAlerts`) — 내부 future 옵션, 공개 약속 아님.
- **EN i18n 문자열**: `src/lib/i18n.ts` en 로케일 + 각 `copy/*.ts` en 키 — 토글만 숨김, 문자열 보존(추후 재개 대비).
- **수익화 문서**: `docs/monetization-strategy.md`, `docs/ornscore-beta-launch-checklist.md` — 내부 전략, 공개 약속 아님.

### (iii) Future roadmap — 이번 작업 범위 밖 (명시적 제외)

- **카카오톡 알림 실발송** — 현 이메일 cron(`api/cron/notify`)을 카카오 알림톡 채널로 확장(파이프라인/비즈니스 채널/템플릿 승인 필요). 본 task 제외.
- **앱스토어 제출** — `docs/app-roadmap.md`, `docs/app-packaging-readiness.md`, `docs/app-packaging-final-checklist.md`, `docs/app-store-submission-pack.md` 참조. 추후 목표, **제출 작업 이번 task 없음.**
- **수익화 활성화** — 결제/환불/청약철회·요금 확정은 오너/법무 게이트. 무료 베타 동안 비활성.
- **영어 재개** — EN i18n 보존되어 있으므로 토글 복원 + 파생 문구 EN 마감으로 추후 재개 가능. 당분간 제외.

---

## 5. 수용 기준 (Acceptance) 매핑

이 문서 하나로 v1 범위 확인 가능:
**무료 · 한국어 전용 · 138종목 · AI 공개 숨김 · 카카오톡 알림 로드맵 · 앱스토어 추후 목표.** (§1 결정 요약 + §3 감사 + §4 체크리스트)
