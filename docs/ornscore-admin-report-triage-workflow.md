# 관리자 데이터 오류 신고 triage 워크플로

> 운영자가 `/admin/status`의 "접수된 데이터 오류 신고"(`data_reports`)를 처리하는 절차.
> 인앱 상태변경 UI는 아직 없다(백로그). 상태 전이는 Supabase에서 직접 수행한다 — **소유자 게이트**.
> 작성: 2026-07-14 (AI Center task 252 · C). 관련: `docs/ornscore-admin-status-backlog.md` §2.

---

## 1. 어디서 보나

- 목록: `/admin/status` → "접수된 데이터 오류 신고 (N)" 패널. `data_reports` 최근 50건(접수일 내림차순).
- 조회 조건: 배포 환경변수 `ADMIN_ENABLED=1` + Supabase env 설정 시에만 실제 목록을 읽는다(개인정보 보호). 미설정이면 graceful 안내만 표시.
- 신고 유입: 공개 `/status`·`/about`의 인앱 폼(`ReportDataIssueForm`) 또는 메일(mailto) fallback. 폼 저장 경로는 `POST /api/report-data-issue` → `data_reports` insert.

## 2. 상태 단계 (읽기 전용 표시)

`/admin/status` 신고 표의 상태는 아래 코드를 한글 뱃지로 보여준다(표시 전용 매핑, 값 변경 아님).

| 코드 | 화면 라벨 | 의미 | 다음 행동 |
|---|---|---|---|
| `new` | 신규 접수 | 아직 안 본 신고 | 내용 확인 → `reviewing`로 |
| `reviewing` | 확인 중 | 원본 데이터와 대조 진행 중 | 사실이면 데이터 수정 후 `resolved`, 아니면 `dismissed` |
| `resolved` | 처리 완료 | 수정 반영 또는 정당한 값으로 확인 | 종료 |
| `dismissed` | 반려 | 재현 불가·중복·비신고성 | 종료 |

알 수 없는 상태 코드는 회색 뱃지로 원값 그대로 표시한다.

분류(category) 코드도 사용자 폼과 동일 어휘로 한글 표시: `price` 가격·거래량 / `financial` 재무(PER·PBR·ROE) / `disclosure` 공시 / `score` 점수·순위 / `sector` 업종 분류 / `other` 기타.

## 3. triage 절차 (권장)

1. `/admin/status`에서 `신규 접수` 뱃지부터 확인한다.
2. 분류·종목·내용으로 원본 대조:
   - 가격·거래량 → KRX / 네이버 금융
   - 재무(PER·PBR·ROE) → 네이버 금융 / 원본 재무제표
   - 공시 → DART 원문
   - 점수·순위·업종 → `docs/ornscore-spec-coverage.md`·산식/업종 규칙 확인
3. 판정 후 상태를 전이한다(§4). 정당한 지적이면 데이터 수정은 **별도 배치/파이프라인**에서 진행하고(이 batch 범위 밖), 신고는 `resolved`로 닫는다.
4. 회신 이메일이 있으면 처리 결과를 안내(선택).

## 4. 상태 전이 방법 (Supabase 직접 — 소유자 게이트)

인앱 update API/버튼은 백로그다. 현재는 Supabase에서 직접 갱신한다.

- Supabase Studio → Table editor → `data_reports` → 해당 행 `status` 편집, 또는 SQL editor:

```sql
-- 확인 시작
update data_reports set status = 'reviewing' where id = '<uuid>';
-- 처리 완료 / 반려
update data_reports set status = 'resolved'  where id = '<uuid>';
update data_reports set status = 'dismissed' where id = '<uuid>';
```

- 접근 권한: service role 또는 운영자 세션만. 익명 update 정책은 두지 않는다.
- 처리자 메모(`data_report_notes`)와 인앱 전이 UI는 백로그(§ 백로그 문서). 그 전까지 메모는 커밋 메시지/운영 노트로 남긴다.

## 5. 관련 문서 / 다음 단계

- `docs/ornscore-admin-status-backlog.md` — 신고 상태 변경 워크플로·`data_report_notes`·인앱 전이 UI(미구현) 백로그.
- `docs/ornscore-admin-operations-checklist.md` — 관리자 보호·필요 env·접근 확인.
- `src/app/api/report-data-issue/route.ts` — `data_reports` 스키마 SQL(파일 상단 주석).
- 다음 진입점: 인앱 상태 전이(update API + `/admin/status` 액션) 구현은 소유자 승인 후 별도 batch.
