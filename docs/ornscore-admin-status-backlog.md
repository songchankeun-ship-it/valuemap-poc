# 관리자 데이터 상태판 — MVP 범위 및 백로그

> 설계서 `ORNSCORE_2nd_QA_improvement_spec.md` PART B §10 / PART I [P2-1][P2-2] 추적 문서.
> 사용자용 `/status`는 공개 유지, 운영자용 `/admin/status`는 내부 운영용(검색 비노출)으로 분리한다.
> 작성/갱신: 2026-06-26 (AI Center task 62).

---

## 0. 2026-07-12 보호 및 운영 홈 상태

`/admin`과 `/admin/status`는 이제 Supabase 로그인 세션 + 관리자 이메일 allowlist로 보호한다.

- 비로그인 접근: `/admin`은 `/login?next=/admin`, `/admin/status`는 `/login?next=/admin/status`로 이동.
- 로그인했지만 허용 이메일이 아님: 관리자 권한 없음 화면 표시.
- 기본 허용 이메일: `contact@ornscore.com`.
- 배포 환경변수로 재정의 가능: `ADMIN_EMAILS=contact@ornscore.com,another@example.com` 또는 `ORNSCORE_ADMIN_EMAILS`.
- `ADMIN_ENABLED=1`은 여전히 신고 목록(`data_reports`) 조회 여부만 제어한다. 페이지 접근 보호와 별개다.
- `/admin`은 운영 홈이다. 데이터 기준일, 산식 일치, 가격 지연 종목 수, 상태 이력 수, 점수 생성 시각, 신고 모드, 주요 운영 링크(`/admin/status`, `/status`, Search Console, sitemap)를 한 화면에 모은다.

운영 전 권장:
- Vercel 환경변수에 `ADMIN_EMAILS=contact@ornscore.com` 명시.
- contact 계정으로 실제 로그인 후 `/admin`과 `/admin/status` 접근 확인.
- 허용되지 않은 다른 계정으로 접근 시 권한 없음 화면 확인.

---

## 1. 이번에 구현한 MVP (읽기 전용)

라우트: **`/admin/status`** (`src/app/admin/status/page.tsx`, 서버 컴포넌트, `robots: noindex`, `dynamic = force-dynamic`).
이미 계산 가능한 값만 노출하고, 새 수집/배치 인프라는 만들지 않는다.

- **자동 점검 요약(selfCheck)** — `dataStatus.selfCheck`: 분석 종목 수 · 검증 보류 수 · 재무 결측 수 · 산식 버전 일치(기대 vs 실제). `/status`와 동일 단일 소스.
- **검증 보류(suspect) 종목 리스트** — `realStockPool` × `isSuspect()` 실측(종목명·코드·PER·PBR·ROE).
- **PER·PBR 결측 종목 리스트** — `realStockPool`에서 PER/PBR 0·결측 종목.
- **접수된 데이터 오류 신고 목록** — `data_reports` 테이블 최근 50건. `ADMIN_ENABLED=1` 일 때만 조회(개인정보 보호). 테이블/ env 부재 시 graceful 안내(페이지는 깨지지 않음).

### 오류 신고 저장 흐름 (P2-2)

- API: **`POST /api/report-data-issue`** (`runtime=nodejs`) — `createAdminClient().from("data_reports").insert(...)`. waitlist 라우트와 동일한 graceful 패턴(테이블/ env 부재 시 500 → UI가 메일로 안내).
- UI: `src/components/status/ReportDataIssueForm.tsx`(클라이언트) — `/status`·`/about` 등 `ReportDataIssue` 진입점에 "앱에서 바로 신고하기(선택)" 폼. **메일(mailto) 버튼은 항상 fallback으로 유지**.
- 테이블 SQL은 라우트 파일 상단 주석에 포함.

```sql
create table if not exists data_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null,          -- price | financial | disclosure | score | sector | other
  ticker text,
  message text not null,
  email text,
  as_of_date text,
  metrics_version text,
  status text not null default 'new'  -- new | reviewing | resolved | dismissed
);
```

---

## 2. 후속 백로그 (이번 미구현 — 운영/데이터 결정 필요)

설계서 §10.4 "관리자 기능 요구사항" 중 인프라가 필요한 항목:

| 항목 | 필요한 것 | 데이터 구조 스케치 |
|---|---|---|
| 배치 실행 이력 | GitHub Actions 워크플로 결과를 DB/로그로 적재 | `batch_runs(id, started_at, finished_at, kind, status, changed_count, error)` |
| 성공/실패 로그 | 수집 단계별 성공/실패 기록(현재 비-blocking `echo skipped`만) | `collect_logs(id, run_id, source, ok, message, at)` |
| 종목별 데이터 누락 추적(시계열) | 결측을 스냅샷마다 적재해 추세 확인 | `missing_snapshots(as_of_date, ticker, field)` |
| 공시 수집 실패 로그 | DART 호출 실패/한도 초과 기록 | `disclosure_fetch_logs(id, ticker, ok, http_status, at)` |
| 수동 재수집 버튼 | 앱에서 워크플로 dispatch 트리거(권한·인증 필요) | GitHub API `workflow_dispatch` + 운영자 인증 |
| 신고 상태 변경 워크플로 | new → reviewing → resolved 전이 + 처리자 메모 | `data_reports.status` 업데이트 UI + `data_report_notes` |
| 수집 성공률·전환 이벤트 모니터링 | 메트릭 수집/대시보드 | 별도 분석 파이프라인 |

### 인증/게이트 후속

현재 `/admin/status`는 `noindex` + 신고 목록만 `ADMIN_ENABLED` 가드. 실제 운영 전에는 **관리자 인증**(Supabase 세션 + 운영자 이메일 화이트리스트 또는 미들웨어 보호)을 붙여 전체 페이지를 보호해야 한다. 종목 파생 리스트(검증보류·결측)는 공개 stocks.json 기반이라 민감도가 낮지만, 운영 일관성을 위해 동일 게이트 권장.

---

## 3. 관련 문서

- `docs/data-source-commercial-risk.md` — 데이터 소스 리스크·전환 로드맵(§10 모니터링과 교차).
- `docs/legal-ai-commercial-readiness.md` — 오류 신고·약관 항목.
- `docs/ornscore-spec-coverage.md` — 설계서 전 항목 상태 추적(§10·§14 행).
