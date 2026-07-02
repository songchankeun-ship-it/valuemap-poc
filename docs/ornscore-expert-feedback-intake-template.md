# 오른스코어 전문가/QA 피드백 배치 인테이크 템플릿

> 작성: Task 129 (2026-07-02, Claude). 목적은 **미래의 QA/전문가 리포트 한 편을 AI Center에 붙여넣으면
> 곧바로 우선순위(P0/P1/P2)가 매겨진 자동화 task 목록으로 바꾸는** 재사용 절차를 고정하는 것이다.
> 매 리뷰마다 severity 정의·불변식·톤 규칙을 새로 발명하지 않도록, 기존 문서의 표현을 **그대로 재사용**한다.
>
> 관련 문서(중복 작성 회피, 여기서는 가리키기만):
> - v1 방향 잠금 + 불변식 원문 → `docs/ornscore-free-beta-v1-scope.md` (§1 결정 요약 · §4 체크리스트)
> - 프로젝트 공유 메모리 · 최근 task 로그 → `docs/AI_HANDOFF.md`
> - 스펙 항목별 상태 매핑(이미 끝난 것 재작업 방지) → `docs/ornscore-spec-coverage.md`
> - Severity 루브릭 원본(독립 QA) → `docs/ornscore-qa-feedback.md` (Task 48)
> - 최근 릴리스 후 QA 실제 적용 예 → `docs/ornscore-post-release-qa-2026-07-02.md` (Task 127)
> - 진행 로그(1줄 단위) → `PROGRESS.md`
>
> 톤 규칙(전 문서 공통): **투자 추천 아님(비자문) / 데이터 신선도 고지 유지 / 미확정은 "미확정"으로만 표기.**
> 이 템플릿을 채운다고 어떤 것도 "승인·출시 확정"이 되지 않는다. 실제 릴리스·머지·외부 계정 변경은 **운영자 게이트**로 남는다.

---

## 0. 목적 · 사용법

**한 줄:** 리포트 붙여넣기 → 항목별 분류(triage) → 검증 가능한 task 프롬프트 방출. 세 단계로만 쓴다.

1. **붙여넣기(intake).** 외부 QA/전문가 리포트 원문을 §7 배치 인테이크 표에 항목 단위로 옮긴다(요약하지 말고 원문 문장을 그대로 인용).
2. **분류(triage).** 각 항목을 (a) §4 불변식 가드로 먼저 거른 뒤 → (b) §5 Severity(P0/P1/P2) → (c) §6 8-카테고리 → (d) 매핑 파일/문서 → (e) 검증 게이트 순으로 채운다.
3. **방출(emit).** 살아남은 항목만 §7 표의 마지막 칸에 §7-A 구조를 따른 task 프롬프트로 적는다. 불변식 위반·코드로 못 닫는 항목은 §8 운영자 버킷으로 보낸다.

### 이 문서에서 다루는 것 / 다루지 않는 것

- **다룬다**: 피드백 한 편을 우선순위·카테고리·검증 게이트가 붙은 **로컬 자동화 task 목록**으로 변환하는 절차와 빈칸 표.
- **다루지 않는다**: 실제 릴리스/`main` 머지/push, 스토어 제출, 결제·가격 확정, 외부 계정·대시보드 변경, 서명 키 관리, 영어 재개.
  이것들은 코드로 닫을 수 없으며 §8 운영자 버킷 또는 별도 운영자 문서(체크리스트)로만 다룬다.

---

## 1. 참조 블록 (링크만, 중복 금지)

| 문서 | 이 템플릿에서 쓰는 이유 |
|---|---|
| `docs/AI_HANDOFF.md` | 공유 메모리 · 직전 task(126/127/128)에서 무엇이 이미 닫혔는지 · 운영자 게이트 현황. **task 방출 전 반드시 최신 Manual Notes 확인.** |
| `docs/ornscore-free-beta-v1-scope.md` | 불변식 원문(§4 가드가 그대로 인용) · Keep-internal(ii) · Future-out(iii) 경계. |
| `docs/ornscore-spec-coverage.md` | 항목별 done/부분/백로그 상태 — 이미 끝난 스펙을 "신규 결함"으로 재기재하지 않기 위한 대조표. |
| `docs/ornscore-qa-feedback.md` (Task 48) | Severity 루브릭·P1-VISUAL 등 승계 항목의 원본. |
| `docs/ornscore-post-release-qa-2026-07-02.md` (Task 127) | 최근 실제 triage 적용 예(P0 0 · P1 1 · P2 3) — 형식/판정 참고. |
| `PROGRESS.md` | 1줄 진행 로그. task 방출·완료 시 여기에 한 줄 append. |

> 규칙: 위 문서의 내용을 **복사하지 말고 가리킨다.** 값(불변식·severity 정의)이 바뀌면 원본만 고치고 여기선 링크로 따라간다.

---

## 2. 불변식 가드 (rejection filter) — triage 최우선 단계

어떤 피드백이든 **가장 먼저** 이 필터를 통과시킨다. 아래 6개 불변식 중 **하나라도 깨야 반영 가능한 항목**은 자동화 task로 만들지 않고, §8 운영자/범위 밖 버킷으로 보낸다. (원문: `ornscore-free-beta-v1-scope.md` §1·§4)

| # | 불변식 | 이걸 깨자는 피드백 예 → 라우팅 |
|---|---|---|
| INV-1 | **무료(유료/"곧 유료" 공개 포지셔닝 금지)** | "결제 붙이자 / 프리미엄 강조" → 범위 밖(제품·법무 게이트). |
| INV-2 | **한국어 전용(EN 토글 숨김 유지)** | "영어 토글 다시 켜자" → 범위 밖(EN 재개는 Future-out iii). |
| INV-3 | **138종목 유니버스 고정** | "종목 수 늘리자/줄이자" → 범위 밖(데이터 파이프라인·오너 결정). |
| INV-4 | **AI 분석 공개 숨김(진입점 차단)** | "AI 분석 카드 공개로 다시 노출" → 범위 밖(코드는 보존, 공개만 차단). |
| INV-5 | **비자문(투자 추천 아님) 고지 유지** | "매수 후보/목표가/강력 추천 문구 넣자" → **거부**(금칙어 위반, 반영 불가). |
| INV-6 | **유료/Pro 비홍보(요금제 내비 강등 유지)** | "요금제를 1차 내비로 강조/구독 유도" → 범위 밖. |

> 이 절의 목적: 리포트가 아무리 그럴듯해도 **불변식을 근거로 scope creep을 거절할 수 있게** 하는 것. Developer AI는 "리포트가 시켰으니"를 이유로 위 항목을 코드 task로 만들지 않는다. 판단이 애매하면 §8로 보내고 운영자에게 남긴다.

---

## 3. Severity 루브릭 (Task 48 / Task 127 재사용)

| Severity | 정의 | 배정 판단 한 줄 |
|---|---|---|
| **P0 — 출시 차단** | 공개 표면의 치명 결함. 전 경로 200 실패·치명 마커(Application error/Hydration/TypeError/…)·확정가 노출·비자문 위반·불변식 붕괴 등. | "이대로 공개하면 안 되는가?" → 예면 P0. |
| **P1 — 릴리스 전 필수(운영자 액션 포함)** | 코드 결함은 아니어도 릴리스 전에 반드시 닫아야 하는 게이트. 예: 실 브라우저 데스크톱/390px 시각 게이트(P1-VISUAL, Task 48 승계), 실기기 OAuth 왕복. | "출시 자체는 가능하지만 운영자가 한 번은 꼭 확인해야 하는가?" → 예면 P1. |
| **P2 — 개선 후보(선택, 소유자 판단)** | 있으면 좋은 폴리시·나이스투해브. 결함 아님. 예: manifest 단일 theme_color, 좌우 safe-area, 문구 미세 통합. | "안 해도 출시에 지장 없는가?" → 예면 P2. |

> P1은 "코드로 즉시 닫힘"과 "운영자 육안/실기기 게이트"가 섞인다. 후자는 §8로도 함께 적어 운영자가 놓치지 않게 한다.

---

## 4. 8-카테고리 분류표

각 피드백 항목을 아래 8개 중 하나(복수 가능)로 태깅한다. "소유 문서/파일"은 그 카테고리가 **보통** 매핑되는 위치이며, "검증 게이트"는 해당 task 완료 시 돌려야 하는 명령이다.

| # | 카테고리 | 여기 속하는 것 | 자주 매핑되는 소유 문서/파일 | 검증 게이트 |
|---|---|---|---|---|
| C1 | **금융 문구 안전(finance wording safety)** | 투자 추천성 금칙어, 비자문 고지 누락/약화, 확정가·수익 보장 뉘앙스. | 금칙어/비자문 고지, `scripts/verify_metrics.py`(금칙어 gate), `src/lib/copy/*` | `PYTHONUTF8=1 python scripts/verify_metrics.py` (138종목·금칙어 0·Metrics 2.4) |
| C2 | **모바일 레이아웃(mobile layout)** | 390px 가로 넘침·텍스트 겹침·카드 붕괴, safe-area 인셋, 반응형 클래스 가드. | 390px/safe-area, P1-VISUAL(Task 48/127), `src/components/*`, `layout.tsx` 뷰포트 | `npm run build` + 운영자 데스크톱/390px 육안(Playwright 미구성 → 자동 시각 게이트는 §8) |
| C3 | **데이터 신뢰/날짜 정합(data trust · date consistency)** | 기준일 불일치, Metrics 버전 표기, 공시 수집 범위 표면 간 모순, 검증 보류 표기. | 기준일 통일 · Metrics 2.4, `src/lib/dataStatus.ts`·`dataQuality.ts`, `public/data/*` | `PYTHONUTF8=1 python scripts/verify_metrics.py` + 대상 라우트 SSR 기준일 grep |
| C4 | **인증/로그인(auth · login)** | OAuth 왕복, 콜백 오리진, 로그인 CTA·빈 상태, 매직링크. | OAuth 실기기 게이트, `docs/auth-providers-setup.md`, `src/app/login/*`·`/auth/callback` | `npm run build` + (실 왕복은 운영자 실기기 게이트 → §8) |
| C5 | **앱 준비도(app-readiness)** | PWA manifest·아이콘·standalone·TWA·assetlinks·패키지명. | `app:check`/assetlinks, `scripts/check-app-packaging.mjs`, `src/app/manifest.ts`, `docs/app-*` | `npm run app:check` (기존 assetlinks WAIT 1건 = 운영자 게이트, 회귀 아님) |
| C6 | **성능(performance)** | 라우트 로드/TTFB, 타임아웃 가드, 로딩 스켈레톤·CLS. | `perf:check`/타임아웃 가드, `src/app/**/loading.tsx`, `withTimeout` 헬퍼 | `npm run perf:check --base http://127.0.0.1:<port>` (advisory 경고 0) |
| C7 | **법무/개인정보(legal · privacy)** | 개인정보 처리·국외 이전·위탁 처리표, 약관, 정책 링크. | `/privacy`·`/terms`·위탁 처리표, `src/app/privacy/*`·`terms/*` | `npm run build` + 정책 페이지 SSR 확정가/누락 grep |
| C8 | **운영자 전용 외부 단계(owner-only external)** | 스토어 제출, 계정 결제, 서명 키, `main` push/릴리스, 도메인·이메일 계정. | 스토어 제출·계정 결제·서명 키·main push (코드로 닫기 불가) | 검증 게이트 없음 → §8 운영자 버킷으로 직행 |

---

## 5. Task 프롬프트 구조 템플릿 (§7-A)

살아남은 각 항목은 아래 6필드를 채운 프롬프트로 방출한다. 필드는 고정한다(빠뜨리면 방출 금지).

```
[범위] 무엇을 바꾸는가 (파일/표면 단위, 1~2줄).
[불변식 유지] 무료·한국어 전용·138종목·AI 공개 숨김·비자문·유료/Pro 비홍보 유지 명시.
[하드 제약] 로컬 docs/소스만 · 점수식·stocks.json·인증/provider/env·DB 스키마·라우트 의미·의존성 무변경 · 신규 npm 0(해당 시).
[검증 게이트] 이 task에 맞는 §6 명령 나열(예: tsc --noEmit · verify_metrics.py · build · app:check).
[완료 기준] 무엇이 참이면 done인가(게이트 통과 + 관찰 가능한 결과).
[비목표] 이 task에서 하지 않는 것(push·머지·스토어·외부 계정·범위 밖 항목).
```

> 관례: 모든 task는 **"task 브랜치 로컬 커밋만 · push/릴리스 미수행"**으로 끝난다. 이 문장을 [비목표]에 항상 포함한다.

### 5-A. 거짓 승인 트리거(false-approval trigger) 회피

방출하는 프롬프트가 자동 승인·릴리스 파이프라인을 실수로 발화시키지 않도록, 아래 표현을 **쓰지 않는다.**

**피해야 하는 표현:** "승인", "승인 완료", "배포 완료 / 출시 확정", "릴리스했다", "머지해도 됨 / main에 반영", "ship it / auto-approve / LGTM 병합", "가격 확정 / 결제 오픈", "스토어 제출 완료". 완료를 단정하는 과거형·명령형도 피한다("배포함", "머지 진행").

대신 **로컬·검증 가능·비트리거** 표현을 쓴다: "로컬 커밋만", "게이트 통과 확인", "운영자 게이트로 남김", "push/릴리스 미수행", "미확정".

| | ❌ 나쁜 예 | ✅ 좋은 예 |
|---|---|---|
| 1 | "모바일 레이아웃 고치고 **배포 완료**해줘." | "`src/components/StocksExplorer.tsx` 표형 테이블 390px 가로 넘침을 additive로 수정. [검증] build + 운영자 육안. [비목표] push/릴리스 미수행(로컬 커밋만)." |
| 2 | "가격 문구 정리하고 **요금제 승인**." | "`/pricing` 문구에서 확정가 뉘앙스 제거·무료 베타 고지 유지. [불변식] 유료/Pro 비홍보. [검증] verify_metrics.py 금칙어 0 + SSR 확정가 grep 0. [완료] 확정 금액 문자열 0건." |
| 3 | "assetlinks 만들고 **스토어 제출 마무리**." | "assetlinks는 운영자 게이트(실 package id+SHA-256 필요)로 남김. 이번 task는 `scripts/check-app-packaging.mjs` 드리프트 가드만 확인. [비목표] 스토어 제출·서명 키·외부 계정 변경 없음." |

---

## 6. (검증 게이트 명령 요약)

triage 중 자주 쓰는 게이트. 카테고리별 매핑은 §4 표 참조.

- `npx tsc --noEmit` — 타입/코드 무결성(exit 0).
- `PYTHONUTF8=1 python scripts/verify_metrics.py` — 138종목·금칙어 0·Metrics 2.4 정합.
- `npm run build` — 라우트 표/SSG 회귀 확인(라우트 표 무변경이 기본 기대).
- `npm run app:check` — 앱 패키징 드리프트 가드(기존 assetlinks WAIT 1건은 운영자 외부 게이트, 회귀 아님).
- `npm run perf:check --base http://127.0.0.1:<port>` — 라우트 200·advisory 경고 0(로컬 prod 서버 필요).
- `git diff --check` — 공백/CRLF 노이즈 확인(이 리포는 전역 CRLF라 노이즈만 정상).
- docs-only 변경일 때: 위 중 `tsc --noEmit`만으로 "소스 무변경"을 확인해도 충분(코드 미변경 증명).

---

## 7. 배치 인테이크 표 (리포트마다 새로 채움)

> 리포트 한 편당 아래 표를 복사해 채운다. **원문 항목**은 요약하지 말고 리포트 문장을 인용한다. 불변식 위반·코드로 못 닫는 항목은 표에 남기지 말고 §8로 보낸다.

리포트 출처: `______________________`  ·  인테이크 일자: `__________`  ·  브랜치: `ai-center/task-___-______`

| # | 원문 항목(인용) | 카테고리(§4) | Severity(§5) | 매핑 파일/문서 | 검증 게이트(§6) | task 프롬프트(§5) | 완료 기준 |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |

### 7-A. 방출 규칙 재확인

- 각 행은 §4 가드 통과 → §5 severity → §6 게이트가 **모두** 채워져야 방출한다.
- P0/P1 우선 방출, P2는 소유자 판단으로 묶어서.
- 방출한 task는 `PROGRESS.md`에 1줄 로그, 완료 시 `docs/AI_HANDOFF.md` Manual Notes에 항목 추가.

---

## 8. 운영자 전용 외부 단계 (코드로 닫을 수 없음)

아래는 자동화 task로 만들지 않고 운영자에게 남긴다(§4 가드에 걸린 항목·C8 카테고리·P1의 운영자 게이트 부분 포함).

- [ ] 실기기 OAuth 왕복(카카오/구글/네이버/이메일 매직링크) — `docs/app-roadmap.md` §5-1 절차.
- [ ] 데스크톱(≥1280px)/390px 실 브라우저 시각 게이트 육안 1회 — Playwright 미구성 상태의 잔여(P1-VISUAL).
- [ ] Android TWA: 실 package id + 앱 서명 SHA-256 확보 → `npm run app:assetlinks -- --package <id> --fingerprint "<SHA-256>"` → `npm run app:check` (인테이크 시트: `docs/ornscore-android-twa-owner-checklist.md`).
- [ ] 스토어 제출 · Play/Apple 계정 결제 · 서명 키 관리 — 실 값 확보 전 손대지 않음.
- [ ] 가격/결제/영어 재개 — 무료 베타 동안 비활성(제품·법무 게이트).
- [ ] `main` 머지 · push · Vercel 릴리스 — 오너 단계. AI task는 브랜치 로컬 커밋까지만.

> 채운 뒤: 운영자가 위 항목을 처리해 값을 돌려주면, 다음 AI가 해당 §4 카테고리의 검증 게이트까지 이어서 닫는다.
</content>
</invoke>
