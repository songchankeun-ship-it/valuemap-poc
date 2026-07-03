# ORNSCORE 설계서 전체 커버리지 추적 (Task 42)

> 사용자가 제공한 7개 설계서를 한 문서에서 추적한다. 각 항목을 코드/기존 큐 작업(#14~#41)과 대조해
> 5개 상태로 분류하고, 남은 상용화 고도화 작업의 다음 큐 우선순위를 제안한다.
>
> 작성: 2026-06-26 (Task 42, Claude). 문서 추적이 주 목적이며, 이 작업에서 앱 UI는 크게 바꾸지 않는다.
> 톤 규칙: 후보·탐색·확인·참고 정보·매수·매도 추천 아님 유지(투자 조언성 신규 표현 0).

## 상태 범례

| 코드 | 의미 |
|---|---|
| ① 완료됨 | 코드/문서에 이미 구현·반영됨 (증거 경로·작업 번호 표기) |
| ② #38~#41 처리 | 1차 안정화 후속 큐(#38~#41)에서 처리되었거나 처리 예정 |
| ③ 남음·소 | 아직 남았고 작게 구현 가능(표시/문구/소규모 컴포넌트) |
| ④ 큰 제품 의사결정 | 데이터 파이프라인·산식·결제·신규 시스템 등 큰 결정 필요 |
| ⑤ 사람/법무/사업 | 개발이 단독으로 끝낼 수 없는 법무·약관·라이선스·사업 판단 |

소유자 표기: **[개발]** / **[제품]** / **[법무·사업]**

## 설계서 원문 확보 상태

7개 설계서 모두 데스크톱(`C:\Users\dongy\OneDrive\바탕 화면\*.md`)에 **원문 존재 → 이번에 전수 정독함**.
(과거 #33~#37 기록의 "PART D/E/F/G/H/K/L/M/N/O/P 원문 미확보"는 당시 PDF만 있고 .md가 레포/데스크톱에 없던 상태를 가리킴 — 이번 Task 42에서 7개 .md 원문을 직접 읽어 그 공백을 메웠다.) 레포 내부에는 없으므로 레포에 커밋되지는 않음.

교차 참고 문서(레포 내):
- `docs/ornscore-improvement-brief.md` — PDF 진단을 자동화 작업 타깃으로 변환한 요약(#14~#37의 실제 작업 근거)
- `docs/data-source-commercial-risk.md` — 데이터 소스 상용 리스크(#37·#39)
- `docs/legal-ai-commercial-readiness.md` — 약관/개인정보/AI 고지(#37)
- `docs/monetization-strategy.md` — 수익화 전략
- `docs/AI_HANDOFF.md` · `PROGRESS.md` — #14~#41 작업 이력

---

# 1. ORNSCORE 1차 상용화 안정화 패치 설계서 (`ORNSCORE_1st_commercial_stabilization_spec.md`)

가장 큰 설계서. PART A~R. 1차 안정화 큐(#33~#41)가 거의 이 문서를 타깃으로 진행됨.

| PART / 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| A. 전역 데이터 상태 객체(§5) | ① | `src/lib/dataStatus.ts` 단일 소스(globalAsOfDate·scoreCalculatedAt·disclosureCollectedAt·metricsVersion·universeCount·status·domainStatuses·sources·notices). #33~#40에서 확장 |
| A. `/api/data-status/global` 라우트(§5.2) | ③ [개발] | 별도 REST 라우트는 없음. 모든 페이지가 서버에서 `dataStatus` 모듈 직접 import(SSR)로 충족 → 외부/클라 폴링 필요 시에만 소규모 추가 |
| A. 전역 적용 페이지 기준일 통일(§5.3) | ① | 홈·today·stocks·stock·disclosures·backtest·compare·status·guide/metrics·footer 모두 `dataStatus` 사용(#33) |
| A. 상태 normal/delayed/error 표시(§5.5) | ① | `status`·`statusLabel`·`domainStatuses`로 price/financial/disclosure/metrics 분리. 가격 delayed는 정직 표시(#33) |
| B. 금지 표현 제거(§7~10) | ① | `verify_metrics.py` FORBIDDEN에 12종 토큰 추가, 화면 문구 교체(#33·#35). 게이트로 0 유지 |
| B. 권장 표현·공통 고지 3줄(§9·§11) | ① | `dataStatus.notices.disclaimer` 단일 소스 → 홈 `RiskNotice`·푸터(#33) |
| C. 종목 상세 번호 중복 수정(§12) | ① | `BeginnerReading.tsx` STEP 목록 1개 캐논, 중복 앵커 칩 제거(#34) |
| C. CTA 버튼 붙음 수정(§13) | ① | `stock/StockHeader.tsx` actionsSlot flex-wrap·gap·44px(#34) |
| C. 데이터 상태 배지 분리(§14) | ① | `stock/PriorityScoreCard.tsx` 독립 pill 3종(#34) |
| D. 공시 호재/악재 → 확인 포인트(§15~18) | ① | `DisclosureExplorer.tsx`·`disclosure-signals.ts` valence 제거·중립화(#35), 카드 5색 토큰(#26) |
| D. 공시 200건 제한 명확화(§19) | ① | `DisclosureExplorer.tsx`·`disclosures/page.tsx`·`StockDisclosures.tsx` 상시 캡션(#35·#41) |
| D. 공시 기간 전체 수집(§19.2 권장안) | ④ [개발] | 전체 기간 DART pagination 수집·저장 = 별도 파이프라인. 현재는 임시안(최신 200건 고지)로 충족. **Task 93**: Pro 관심 종목 공시 알림이 "최신 200건 일반 피드"에 의존하지 않도록(종목 단위 DART 조회 + 영속 커서) 구현 준비 설계 노트를 `ornscore-beta-launch-checklist.md` (g)에 추가 |
| D. 홈↔공시 숫자 동기화(§20) | ① | `recentSignals.ts`·`api/disclosures/recent` signalCount 클램프, 샘플 폴백 교정(#35) |
| E. 백테스트 제목·고지·리밸런싱 문구(§22~25) | ① | `BacktestClient.tsx` "실험 전략", `BacktestRiskNotice.tsx`, 3날짜 분리, 리밸런싱 "추천 아님"(#27·#35) |
| F. 비교 빈 상태 개선(§26~27) | ① | `compare/page.tsx`·`CompareClient.tsx` 추천 세트·최근 본 종목·오늘 Top5·관심·검색·업종(#36·#41). **Task 158**: 결과 화면도 편집 가능하게 — 상단 "바스켓 관리" 섹션(슬롯 카운터 `{n}개 담음·{남은}개 더`, 컴팩트 `StockSearchBox`+최근/Top5/관심 중복제거 빠른추가 칩, 4개 도달 시 입력 숨김·안내), 모든 담기를 공통 `tryAdd`로 라우팅(상한초과/중복 3초 안내), 잘못 담은 종목 `remove` 후 5초 "실행 취소"(두 화면 공용 `feedbackRegion`, `aria-live`). `compare.ts`/점수식/데이터 무변경 |
| G. 상단/모바일 메뉴 단순화(§28) | ① | `Sidebar`·`MobileNav`·`MobileBottomNav` 1차 5메뉴+더보기, 모바일 4셀(#36) |
| H. 종목 탐색 검색 우선·프리셋·필터(§29~31) | ① | `StocksExplorer.tsx` 검색 우선·질문형 프리셋·접힘 상세 필터·칩(#36). 추가 감각화는 §7. 참고 |
| I. 점수/순위 표현 분리(§32~33) | ① | `stock/MetricInsightCards.tsx`·`PriorityScoreCard` "점수 v/100" + "전체 상대순위" + "상위 X%" + "해석:"(#34) |
| J. 밸류 전체/업종 분리(§34~35) | ②/③ | `stock/[ticker]/page.tsx` 업종 밸류 별도 표시·저표본 중립 톤(#34·#41). **종합점수에 업종 보정 반영은 산식 변경(④, §35.2)** |
| K. 무료/유료 경계 재설계(§36~38) | ①/④ | `pricing/page.tsx` Free/Pro/**Premium 3티어** 정보구조·기능 비교표·전환 문구·`limits.ts`+`pricing.ts` 단일 출처(#36·**#46**). **가격은 전부 미확정(④, 출시 전 확정·공지)·결제/권한 게이트 미연결(④)** |
| L. 데이터 소스 상용 리스크(§39~41) | ②/⑤ | `docs/data-source-commercial-risk.md` 표·체크리스트(#37·#39). **약관 결론은 [법무] 확인 필요(⑤)** |
| M. 약관/개인정보/AI 고지(§42~44) | ②/⑤ | terms 유료(출시 예정 초안)·privacy 국외이전 표·`AiAnalysisCard` 고지(#37). **결제 약관 확정은 [법무·사업](⑤)** |
| N. 관리자 데이터 상태판(§45) | ④ [개발] | 사용자용 `/status`만 존재. 관리자 전용 수집 성공률·API 오류 로그·수동 재수집 버튼 = 신규 시스템 |
| N. 오류 신고 관리(§46) | ③/④ | 사용자 신고 진입점 = mailto(`ReportDataIssue`, #40). **신고 저장소·상태 변경·관리자 메모는 영속 시스템(④)** |
| O. QA 체크리스트(§47~53) | ② | #38 데스크톱/390px 시각 QA 스윕에서 12경로 점검(코드 0수정·치명 오류 0). **실 브라우저 모바일 게이트는 운영자(⑤)**. **Task 154(피드백 인테이크 루프 드라이런)**: `docs/ornscore-expert-feedback-intake-template.md`(Task 129) 루프를 SAMPLE 리포트로 1회 실행 → `docs/ornscore-expert-feedback-dry-run-2026-07-03.md`(거부/P2 방출/운영자 버킷/중복 드롭 4경로). 템플릿 §7에 dedup("이미 추적/완료?")·"운영자 전용?" 칸 additive 추가로 중복 task 방지 강제. 문서 전용(소스 무변경) |

# 2. ORNSCORE 상용화 고도화 설계서 (`ornscore_commercialization_upgrade_spec.md`)

장기 상용화(Pro 유료화·알림·개인화·B2B) 로드맵. 1차 안정화보다 큰 범위.

| 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| 4.1 사용자용 데이터 상태판 | ① | `/status`·헤더 신뢰 배지(#33~#40) |
| 4.1 관리자용 데이터 상태판 | ④ [개발] | 미구현(§N과 동일). 수집 성공률·누락 리스트·API 오류 로그 신규 시스템 |
| 4.2 기준일 표시 | ① | 전역 `dataStatus`(#33) |
| 4.3 데이터 오류 신고 | ③ | mailto 진입점 존재(#40). 카드별 인라인 신고 버튼·저장은 후속 |
| 4.4 데이터 품질 로그(관리자) | ④ [개발] | 일별 수집 성공률·실패 이력 영속 로그 미구현 |
| 5.1~5.2 점수 근거 보기 | ① | `lib/scoreBasis.ts`+`stock/ScoreBasisBreakdown.tsx` 종합 점수 근거 보기(4지표 각 25% 동일 가중·지표별 기여 ≈N점·근거 factor[수익률·거래대금 ratio·PER/PBR/ROE·업종 상대·변동성/낙폭/Sharpe]·강점/주의·결측 시 "추후 데이터 축적 후 제공")(#43). `stock/MetricInsightCards.tsx`(#34)·`BeginnerReading`·`guide/metrics` "4지표 25% 동일 가중" 보강(#43) |
| 5.3 점수 변화 히스토리 | ①/④ | `ScoreHistoryChart.tsx`(빈 상태 "추후 축적 후 제공·10회+ 추세 그래프" 명확화 #43)·`history/page.tsx`·`scoreHistory.ts`·cron `save-scores`(Supabase). **장기 시계열 누적·급변 사유 자동화는 데이터 축적 필요(④)** |
| 5.4 점수 급변 알림 | ①/④ | `conditionAlerts.ts`·`cron/evaluate-alerts`·`settings/notifications`. **Task 45**: 설정 페이지에 점수 급변 알림을 미리보기 종류로 노출 + 실데이터(전일 대비 변화/없으면 형식 예시) 예시 카드(`AlertExampleCards`). **실제 발송 라이브·임계 튜닝·전일대비 급변 자동 산출은 운영/데이터 결정(④)** · **Task 144**: 점수 급변을 `AlertEvent`(type=`watchlist_score_surge`) 스키마·알림톡 템플릿 초안으로 매핑(`docs/ornscore-kakaotalk-alert-backlog.md` §2·§3, 무발송 설계) |
| 6.1~6.3 공시 분류·해석 카드 | ① | `disclosureType.ts`·`DisclosureSummaryCards`·`DisclosureExplorer`(#26·#35) |
| 6.2 공시 중요도 점수 | ④ [개발] | 시총 대비 규모·과거 반응 기반 중요도 산출은 신규 모델·데이터 |
| 6.4 공시 후 주가 반응 통계 | ④ [개발] | "최근 3년 유사 공시 N건 평균 수익률" = 대규모 이벤트 스터디 데이터/파이프라인 |
| 6.5 공시 알림 | ①/④ | 조건 알림 골격 존재. **Task 45**: 관심 종목 공시 알림(라이브)을 알림 종류 카탈로그에 명시 + 실 공시 신호 예시 카드. 공시 타입별 알림 세분화·공시 중요도(80+) 알림 발송은 후속(④) |
| 7. 알림 시스템(이메일/웹/텔레그램/카카오) | ③/④ | 이메일 cron(`notify`·`daily-insight`) 골격. **Task 45 (UX MVP 완료)**: `settings/notifications` 재구성 — 9종 알림 종류 카탈로그(`alertCatalog.ts`/`AlertTypeCatalog`, 라이브 2종+미리보기 7종), 미리보기 토글 로컬 저장(`alertPrefs.ts`, 무발송·의도적 비연결), 채널 현황 정직 표시(`NotificationChannels`, 이메일=사용 중/웹·텔레그램·카카오·앱푸시=준비 중), 실데이터 예시 카드, 비로그인도 개념 열람 + 로그인 CTA, `/watchlist` 연결 CTA. **Task 144**: 오너의 카카오톡 알림 선호를 로컬 전용 단계 백로그로 고정 — `docs/ornscore-kakaotalk-alert-backlog.md`(§0 가드레일·§1 표면 감사·§2 로컬 vs 오너·§3 Stage 1~4[채널선호 UI·`AlertEvent` 스키마·알림톡 템플릿 초안·폴백]·§4 오너 외부 설정 빈칸 시트·§5 검증). 이메일-우선 잔여 문구 소프트닝(`copy/today.ts`·`copy/stocks.ts`·`ConditionAlertsManager.tsx` "현재는 이메일 발송, 카카오톡 알림 준비 중"). **신규 종류 실발송·웹/텔레그램/카카오 채널·발신프로필·템플릿 심사·대행사·건당 과금·종류별 Supabase 스키마는 후속·오너 게이트(④/⑤)** · **Task 148**: 관심 종목↔알림을 하나의 무료 기능 경로로 묶는 로컬 UX 패스 — `WatchlistClient.tsx` 알림 CTA에 "지금 되는 것 vs 준비 중" 1줄(공시·저장 필터 알림=이메일 임시·베타, 카카오톡=준비 중), 카카오톡 알림 백로그 Stage 1 item B(`NotificationChannels` 카카오 행 보조 카피)·item C(`KakaoAlertPreview.tsx` 신설 — 카카오 말풍선 정적 프리뷰, `AlertExampleData` 재사용·무발송·"실제 발송된 메시지가 아닙니다" 고지) 로컬 구현, `settings/notifications`에 렌더. `alertPrefs`는 localStorage-only·무발송 그대로(채널맵 확장=실발송 결정과 함께 잔여). 이메일 cron·`features.ts`·점수식·인증 무변경, 제3자 호출 0 |
| 8. 개인화 대시보드 | ①/④ [제품] | `watchlist`·`history`·`recentViews` 위젯 일부. **Task 156**: 홈(`/`)에 재방문 개인화 진입점 `MyStocksSection`(관심 우선→최근 본 중복 제거 컴팩트 행·종목명/업종/종합점수/등락률·`/stock` 링크) 신설 — `MarketSnapshotCards` 아래·`TopCandidateSection` 위에 배치해 재방문자가 내 맥락을 먼저 봄, 첫 방문자는 압박 없는 차분한 빈 상태만. 마운트 가드로 하이드레이션 안전·저장소 차단 graceful·점수 로직 무변경(`realStockPool`에서 룩업만 파생). 통합 개인화 대시보드(그룹·메모·맞춤 브리핑)는 여전히 제품 설계 필요(④) |
| 8.2 관심 종목 그룹/메모/CSV | ③/④ | `watchlist.ts` 추가/삭제·점수 델타 존재. 그룹·메모·CSV는 신규 기능. **Task 160**: 관심 종목 리텐션 루프 폴리시(알림 이전에도 담기·재방문이 가치 있게) — `AddToWatchlistButton.tsx` 추가/제거 토스트 분기(추가 2.5s·제거 5s+`실행 취소` 되돌리기, aria-live 상시 렌더, 모바일 `MobileBottomNav` 위 `bottom-[calc(3.5rem+safe-area)]`·`lg:bottom-6`, 44px 탭타깃·언마운트 타이머 정리), `WatchlistClient.tsx` 리스트 인라인 제거 `실행 취소`(5초·compare와 동일 패턴)·제거 aria-label 종목명 포함·삭제 버튼 44px·"내 현황/빈 상태" 카피, **정직 프레이밍** 강화("담기=별도 알림 없이 로컬 기록, 메일 알림은 이메일만 임시·베타, 카카오톡·푸시 준비 중" — 라이브 알림 배선 암시 0·`매수/매도/추천/수익 보장` 0), `watchlist/page.tsx` 헤더 로컬 추적 1줄 추가. 점수식/데이터/인증/알림 배선 무변경·제3자 호출 0. 그룹·메모·CSV는 여전히 신규 기능(④) |
| 8.3 저장 필터 | ① | `savedSearches.ts`·`ConditionAlertsManager`(#36) |
| 9. 백테스트 고도화(KPI·차트·기여) | ① | `/backtest` KPI 수익/위험 분리·히트맵·낙폭·기여 막대(#27) |
| 9.1 생존편향 실해결 | ④ [개발] | 시점별 유니버스 재구성 = 큰 데이터 작업. 현재 면책 문구 |
| 9.5 조건 커스터마이징 백테스트(Premium) | ④ [제품] | 사용자 조건 입력 백테스트 미구현 |
| 10. 종목 커버리지 확대(138→500→전체) | ④ [개발] | 현재 138종목. 단계적 확장은 데이터 품질·파이프라인. **Task 47**: 단계(1단계 KOSPI200·KOSDAQ150·ETF→2단계 상위 500→3단계 전체)·§10.4 주의사항·사용자 제한 안내를 `docs/ornscore-beta-launch-checklist.md`(c)에 정리, `/status`·`dataStatus.knownLimits`에 "종목 커버리지" 1줄 노출(138종목·전체 아님·단계적 확대 고지). 실제 확장은 ④ |
| 11. 유료화 구조(Free/Pro/Premium) | ①/④ | **Task 46**: Free/Pro/Premium **3티어 정보구조 완료** — `lib/pricing.ts`(PLANS 단일 출처·status active/planned·priceConfirmed=false), `pricing/page.tsx` 3카드+**기능 비교표**(✓/—/준비 중)+§11 가치 한 줄(시간 절약·변화 알림·기록·리서치 보조), `lib/features.ts` Premium 미구현 항목 plan 경계 표시. **가격은 전부 "검토 중·미확정"(④, 단일 확정 금액 금지)·실제 결제/구독 권한 게이트 미연결(④)** |
| 13. 법적 리스크 관리·고지 | ②/⑤ | 고지 문구 반영(#33·#37). **Task 46**: 요금제 페이지에 §13.2 서비스 공통 고지(투자 추천 아님·매수·매도 추천 아님·최종 책임 본인) 정렬, §13.4 권장 CTA(출시 알림 받기·자세히 보기)만 사용·§13.3 금지 UI/카피 신규 0. 결제 약관 [법무](⑤) |
| 14. 관리자 기능(대시보드·사용자·콘텐츠 관리) | ④ [개발] | 미구현. 결제 사용자·알림 발송률·콘텐츠 관리 신규 시스템. **Task 47**: MVP(읽기 전용 현황·`/status` selfCheck 근접) vs 후속(재수집·재계산·계정정지·결제이력)을 `beta-launch-checklist`(d)에 분리·소유자 표기 |
| 15. 기술 고도화(파이프라인·알림 인프라·결제·권한) | ④ [개발/사업] | 결제 연동·구독 권한·영수증 등 미구현. **Task 47**: §15.5 필수 로그·§15.1~15.4를 "현재 점검됨(selfCheck·verify_metrics 게이트) vs 미점검(수집 성공률·API 실패·발송 성공률·전환 이벤트)"으로 `beta-launch-checklist`(e)에 정리 |
| 16~18. 상용화 로드맵·MVP | ④ [제품] | 로드맵 자체가 제품/사업 결정. **Task 47**: §16 현재 위치(Phase 1 마무리→Phase 2 진입)·§18 MVP 11항목 "베타 노출 가능 vs 준비 중"을 `beta-launch-checklist`(a)(b)에 추적(8 노출 가능 / 3 준비 중=공시알림·점수알림·결제) |
| 19. 추천 요금제 | ①/④ | **Task 46**: §19.1 Free/Pro/Premium 구성을 `pricing.ts`+요금제 페이지 정보구조로 정직하게 반영. §19.2 가격 추천(월 9,900~14,900·29,000원대)은 **확정 아님 표기로만** 노출(미확정·출시 전 확정). 가격 확정·결제는 제품/사업 결정(④) |

# 3. 데이터 기준일 통일 / 신뢰 배지 설계서 (`ornscore_data_trust_badge_spec_v1.md`)

| 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| 5. 전역 DataTrustBar | ①/③ | `components/trust/TrustLayer.tsx`(DataTrustBar·DataTrustModal·DataSourceBadges) → `AppHeader.tsx`에 연결. **모든 페이지 상단 "항상 보이는 바" 형태가 아니라 헤더 모달+푸터 라인 조합** → 페이지 헤더 상단 인라인 바 확장은 ③(소) |
| 6. 데이터 상태 5단계 배지 | ②/③ | `dataStatus.status`·`domainStatuses`로 normal/delayed/limited 등 표현. partial/error 등 5단계 풀세트 라벨·색은 부분 → 미세 정렬 ③ |
| 7. 기준일 표기 정책(페이지별) | ① | 가격·점수/공시 수집/백테스트 생성일 분리 표기(#35·#41) |
| 8. 산식 버전 단일화 | ① | `EXPECTED_METRICS_VERSION="2.4"`·`metricsEffectiveDate` 단일 소스. footer·guide·stock·changelog 동일 값 |
| 8. 산식 불일치 빌드/서버 감지 | ①/③ | `selfCheck.metricsVersionMatch`(런타임 자기점검). **빌드 시점 배포 차단 훅은 미구현 → ③(소, CI 스크립트)** |
| 9. 데이터 출처 배지·툴팁 | ① | `DataSourceBadges`·`DataTrustModal` 출처별 usage |
| 10. 페이지별 신뢰 배지 | ① | 홈/탐색/상세/공시/백테스트/가이드 각 고지·배지(#26·#27·#35·#41) |
| 11. DataTrustModal | ① | `TrustLayer.tsx` 모달(기준일·출처·산식·상태·제한·투자 고지) |
| 12. 데이터 상태 상세 페이지 `/status` | ① | `status/page.tsx` 강화(#37·#40) |
| 13. 산식 변경 이력 페이지 `/guide/metrics/changelog` | ① | `guide/metrics/changelog/page.tsx` 존재 |
| 17. 검증 로직(산식/기준일/상태) | ①/③ | `selfCheck` 런타임 검증. 기준일 페이지 간 자동 비교 단언은 부분 → ③ |
| 20. 접근성(색 의존 금지·키보드·aria) | ① | 배지·모달 aria/ESC/키보드(#26~#40 톤 가드) |

# 4. 디자인/비주얼 개선 설계서 (`ornscore_design_improvement_spec.md`)

Phase 1~7. 디자인 큐(#14~#27)가 이 문서를 타깃으로 진행됨.

| Phase / 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| Phase 1. 디자인 시스템(컬러·버튼·카드·배지·게이지) | ① | `components/ui/`(MetricBar·MetricChip·ScoreBadge·ScoreGauge)·`scoreColor.ts` |
| Phase 2. 홈 리뉴얼 | ① | `components/home/*`(§5와 동일, #5 home redesign 큐) |
| Phase 3. 오늘 페이지 | ① | `components/today/*`(TodayStatusBar·TodayTopSection·SignalSection) |
| Phase 4. 종목 탐색 | ① | `StocksExplorer.tsx`·`stocks/StockResultsTable.tsx`(#36) |
| Phase 5. 종목 상세 | ① | `components/stock/*`(§6과 동일, 결론 카드 큐) |
| Phase 6. 공시 신호 카드 피드 | ① | `disclosures/DisclosureSummaryCards`·`DisclosureExplorer`(#26) |
| Phase 7. 백테스트 | ① | `backtest/*`(#27) |
| 5.3 등락 색 정책(상승=red/하락=blue) 전역 고정 | ②/③ | 화면별 적용됨. 전역 토큰(#F6F8FB 등 라이트 토큰)·역할 색 완전 고정은 미도입 → ③ |
| 15. 모바일 카드형 재구성 | ① | 종목/공시/백테스트 카드형(#26·#27·#36) |
| 20.4 로딩 스켈레톤 | ③ [개발] | 일부만. 전 영역 스켈레톤 표준화는 소규모 후속 |
| 라이트 모드 전역 토큰 도입 | ④ [제품] | 현재 다크 기준. 라이트/디자인 토큰 전면 전환은 큰 디자인 결정(범위 외로 남겨둠) |

# 5. 홈 첫 화면 개편 설계서 (`ornscore_home_redesign_spec_v1.md`)

| 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| 5. 히어로(가치 우선 카피·CTA·미니 대시보드) | ① | `home/HomeHero.tsx` |
| 6. 시장 스냅샷 카드 4개 | ① | `home/MarketSnapshotCards.tsx`(분석 종목·종합 80+·거래 급증·공시 신호) |
| 7. 오늘 추가 확인 후보 카드 | ① | `home/TopCandidateSection`·`StockCandidateCard`(순위·점수·강점·주의·CTA) |
| 8. 오늘 먼저 볼 공시 신호 | ① | `home/DisclosureSignalSection`·`DisclosureSignalCard`(분류 신뢰도·확인 포인트) |
| 9. 사용 방식 3단계 | ① | `home/HowItWorksSection.tsx` |
| 7. 투자 추천 아님 고지 | ① | `home/RiskNotice.tsx` 3줄(#33) |
| 16. 기준일 통일·"추천" 오해 방지·숫자 해석 보조 | ① | `dataStatus`·후보/탐색 톤(#33~#35) |
| 18. 3차: 개인화 관심종목·맞춤 브리핑·이메일 알림 | ③/④ | cron `daily-insight`·`notify` 골격. 홈 개인화 위젯·맞춤 브리핑은 후속(개인화 대시보드와 함께, ④) |

# 6. 종목 상세 상단 결론 카드 설계서 (`ornscore_stock_detail_conclusion_card_spec_v1.md`)

| 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| 5~6. StockConclusionHero 구조 | ① | `components/stock/StockConclusionHero.tsx`(StockHeader·PriorityScoreCard·ConclusionSummaryCard·StrengthWarningPanel·NextActionButtons) |
| 6.3 현재 결론 카드(종목 유형 자동 분류) | ① | `lib/conclusion.ts` `classifyConclusion()`(저평가+추세·과열 주의·균형형 등) |
| 6.2 탐색 우선도 카드(점수·순위·완성도) | ① | `stock/PriorityScoreCard.tsx`(점수/100·전체/업종 순위·데이터 배지)(#34) |
| 6.4 강점/주의 분리 | ① | `stock/`(StrengthWarningPanel 또는 page 분기)·`metricReadings.ts` |
| 6.5 다음 확인 액션 버튼 | ① | `stock/NextActionButtons.tsx`(공시·재무·점수근거·업종비교) |
| 7. 위험 경고 분리(급등/과열/변동성 단계) | ① | page riskNote·급등 위험 캡션(#33·#34) |
| 8. 지표 요약 미니 바(상위 %) | ① | `stock/MetricInsightCards.tsx` 상위 X% 막대(#34) |
| 9. 초보자용 결론 문장 | ① | `BeginnerReading.tsx`(유형별 확인 항목) |
| 10. 상단 탭 구조(요약/차트/재무/공시/점수근거/업종) | ① | `StockTabs.tsx`·섹션 앵커 |
| 11. 모바일 압축 레이아웃 | ② | #38 390px 소스 점검(StockHeader·PriorityScoreCard 가드). 실 브라우저 게이트는 운영자(⑤) |
| 3차: 결론 문장 고도화·맞춤 문구·비교 후보 자동 추천 | ③/④ | 현재 규칙 기반. 관심종목 기반 맞춤·자동 추천은 후속 |

# 7. 종목 탐색 필터 UI 감각화 설계서 (`ornscore_stock_filter_ui_spec_v1.md`)

| 항목 | 상태 | 증거 / 비고 |
|---|---|---|
| 5. 페이지 헤더(조건 충족 수·기준일·상태) | ① | `StocksExplorer.tsx` 헤더 |
| 6. 탐색 모드 탭(질문/지표/직접) | ① | `StocksExplorer.tsx` 모드 탭(#36) |
| 7~8. 질문형 프리셋 카드화(설명·조건 배지·예상 결과 수) | ②/③ | 질문형 프리셋 존재(#36). **카드형(설명+조건 배지+현재 결과 수) 풀 디자인은 부분 → ③(소, 표시 강화)** |
| 9. 빠른 프리셋 칩 다중 선택 | ① | `StocksExplorer.tsx` 칩 |
| 10. 현재 적용 조건 요약 바(자연어 설명) | ②/③ | 칩 바·초기화 존재. **자연어 한 줄 설명 생성("…밸류가 낮고 거래활성도가 늘어난 종목")은 부분 → ③(소)** |
| 11. 정렬/보기 방식(카드/표/압축) | ①/③ | 정렬 그룹·카드/표 토글 존재(#36). **압축형 보기는 부분 → ③** |
| 12. 상세 필터 패널(접힘·예상 결과 수) | ① | 접힘 상세 필터 존재. **Task 157**: 필터 조절 중 "예상 결과 N개 / 전체 M개" 실시간 카운트를 `FilterPanel` 상단 sticky 헤더로 노출(`filterLiveCount` ko/en, 데스크톱 사이드바·모바일 드로어 공용, `sorted.length` 재사용·점수식 무변경) |
| 13. 결과 카드 강점/주의 라벨 | ① | `deriveSignals`·결과 카드(#36) |
| 14. 결과 없음 상태(조건 완화 제안) | ① | `StocksExplorer.tsx` 빈 상태·완화 안내(#36). **Task 157**: 검색어만 있고 0건인 경우 "'{검색어}'에 맞는 종목이 없어요"·철자 확인 안내·"검색어 지우기"(`setQuery("")`) 분기 추가(`emptySearchTitle`/`emptySearchHint`/`clearSearch` ko/en), 기존 필터 완화(`relaxStrongest`/`backToDefaultReset`) 경로 보존 |
| 15. 저장 조건/알림 CTA | ① | `savedSearches.ts`·`ConditionAlertsManager`(#36) |
| 17. 모바일 바텀시트 필터 | ②/③ | 반응형 접힘 패널 존재. **바텀시트 인터랙션 풀세트는 부분 → ③** |
| 18. 접근성(aria-pressed·tabular-nums·44px) | ① | 톤 가드(#36·#38) |

# 8. ORNSCORE 2차 고도화 QA 설계서 (`ORNSCORE_2nd_QA_improvement_spec.md`)

공개 사이트 재점검 기반 2차 마감 품질 설계서. PART A(P0)·B(P1)·C(문구)·D~H·I(티켓)·J(QA 체크리스트). **Task 60에서 PART A·PART I의 P0 5종을 반영**.

| PART / 티켓 | 상태 | 증거 / 비고 |
|---|---|---|
| A §3 / I [P0-1] 종목 상세 초보자 해석 번호 중복 | ① | **Task 60**: `BeginnerReading.tsx` "먼저 확인할 것" `<ol>/<li>`(자동 번호+내부 배지 → `1. 1` 중복)을 **STEP 카드(`<a>` 카드 + `STEP n` 단일 배지)**로 교체. 번호는 `STEP {i+1}` props 단일 출처, ol 자동 번호 제거. `CONFIRM_ORDER` 텍스트·href·`#basis`/`#disclosures`/`#financials` 앵커·읽기 순서 보존. SSR에 STEP 1/2/3 렌더 확인, `1. 1` 중복 0 |
| A §4 / I [P0-2] 비교 페이지 빈 상태 검색/추천 UI | ① | **이미 완료(#36·#41)** — `CompareClient.tsx` 빈 상태(stocks<2)에 검색·추천 비교 세트·최근 본 종목·오늘 Top5·관심 종목·업종 탐색 + "최소 2개·최대 4개" 안내 + 1개 선택 시 "1개 더 선택" 가이드. ≥2 선택 시 비교 결과 전환. Task 60에서 spec §4 대비 검증만(재구축 0) |
| A §5 / I [P0-3] 백테스트 "마지막 리밸런싱 보유 10종목" → "보유" 제거 | ① | **Task 60**: `BacktestClient.tsx` 제목 "마지막 리밸런싱 **보유** {n}종목" → "마지막 리밸런싱 **구성 예시** {n}종목". 캡션도 spec 권장문("과거 백테스트 규칙을 마지막 리밸런싱 시점에 적용했을 때의 구성 예시입니다 · 현재 확인 후보나 추천이 아닙니다.")으로 강화. SSR "리밸런싱 보유" 0건 |
| A §6 / I [P0-4] 홈 공시 숫자에 "최신 200건 내" 기준 명시 | ① | `MarketSnapshotCards.tsx` 공시 신호 카드 "DART · 최신 200건 내" **기존 완료**. **Task 60**: 홈 "오늘 먼저 볼 공시 신호"(`DisclosureSignalSection.tsx`) 설명에 "DART 최신 200건 내" 기준 추가(두 홈 공시 표면 일관). SSR 양쪽 렌더 확인 |
| A §8 / I [P0-5] 종목 탐색 상세 필터/펼치기 텍스트·숫자 중복 제거 | ① | **Task 60**: `StocksExplorer.tsx` 상세 필터 버튼 카운트 배지를 라벨에서 분리(`ml-0.5`→`ml-1.5` + 라벨 `<span>` 래핑 + `aria-label`)해 "▾1"로 안 읽히게. 모바일(`lg:hidden`)/데스크톱(`hidden lg:inline-flex`) 변형은 브레이크포인트 배타라 동시 노출 없음. 빠른 프리셋 `펼치기 ▾`/`접기 ▴`는 `group-open` 토글로 단일 노출(기존). 필터 로직 무변경 |
| B §7 [P1-1/P1-2] Free/Pro/Premium 경계·무료 알림 제한 | ①/④ | **Task 61**: 표시 경계 정직 재설계 — `limits.ts` Free 한도 축소(관심 20→5·AI 3→1), `pricing.ts` Free 알림="베타 무료 체험·정식 출시 시 Pro"·Pro `includes` 알림 핵심 승격·`COMPARE_ROWS` 알림 free="베타 무료", `pricing/page.tsx` 정직 한 줄, `features.ts` 알림 2종 `betaFree/plannedPlan:"pro"` 마커(크론 `notify`·`evaluate-alerts` 무변경=라이브 보존). **실 결제·구독 권한 게이트·가격 확정은 ④/⑤(미연결)** |
| B §8 종목 탐색 정보 밀도(첫 화면 검색·프리셋 강조) | ①/③ | 검색 우선·질문형 프리셋·접힘 상세 필터(#36) + 필터 텍스트 중복 제거(#60). 모바일 바텀시트 풀세트는 설계서 7 ③ |
| B §9 [P1-3] 종목 상세 초보자 카드 내부 CTA | ① | **Task 61**: `BeginnerReading.tsx` 하단 안내문 → 카드 안 직접 `<NextActionButtons />`("다음으로 확인하기": 공시·재무·점수 근거·업종 비교) 블록으로 교체. STEP 카드·읽기 순서·모바일 2열(44px) 보존 |
| B §10 [P2-1] 관리자 데이터 상태판 | ①(MVP)/④ | **Task 62**: 읽기 전용 `/admin/status`(noindex·force-dynamic) — selfCheck 요약(분석/검증보류/결측/산식)·검증보류 종목 리스트·PER·PBR 결측 리스트·`data_reports` 최근 신고(ADMIN_ENABLED=1 시). `/status` 무변경(공개 유지). **배치 이력·수집 실패 로그·수동 재수집·신고 워크플로·관리자 인증은 백로그**(`docs/ornscore-admin-status-backlog.md`) |
| B §10 [P2-2] 오류 신고 DB 저장 | ①(MVP)/④ | **Task 62**: `POST /api/report-data-issue`(nodejs, `data_reports` insert, waitlist 동일 graceful) + `ReportDataIssueForm.tsx`(인앱 폼) — **mailto 버튼은 항상 fallback 유지**(env/테이블 부재 시 안 깨짐). 테이블 SQL은 라우트 주석·백로그 문서. 신고 상태 전이 워크플로는 ④ |
| C §11~13 문구 조정(급등/고점추격/시장관심) | ① | **Task 61**: `StocksExplorer`(프리셋 "급등했지만 위험"→"최근 상승폭이 커진 종목")·`guide/metrics`·`metricReadings`·`ScoreTooltip`·`today` "고점 추격"/"시장의 관심" → 변동성·확인 포인트 중립 표현. 금칙어 신규 0 |
| D §14~15 공시 200건/분석 대상 필터 | ④/① | **Task 61(§15)**: `DisclosureExplorer` "전체 시장/분석 대상만" 범위 토글(기본 전체, scoped 카운트 일관) + 홈 `pickTopSignals` universe 인자(홈 공시=분석 대상만, 표시필터·`direction` 무변경). **공시 전체 기간 수집(§14 A안)은 ④** |
| E §16~17 백테스트 고지 중복·KPI 균형 | ① | **Task 61**: `BacktestRiskNotice` 중복 고지 1줄 제거(헤더 1회+한계 박스 1회로 단일화), `BacktestClient` KPI 그리드 아래 위험 비교 한 줄(MDD/Sharpe vs 벤치) 추가(수치 무변경). 수익/위험 균형 캡션은 기존(#27) |
| F §18 [P2-3] 데이터 소스 상용 리스크 | ②/⑤ | **Task 62**: `data-source-commercial-risk.md` 보강 — §18 컬럼 형식 요약표(KRX·DART·Naver·yfinance·FDR / 용도·상용가능성·장애·대체·조치) + "핵심 유료 기능→공식·안정 데이터 전환 로드맵"(재무 1순위·현재가 2순위·yfinance 3순위·KRX 4순위·업종 중기) + 날짜 갱신. 법적 결론은 **[법무] 확인 필요** 유지 |
| F §19 [P2-4] 업종 휴리스틱 리스크 UI 표시 | ① | **Task 62**: `SectorComparison.tsx`·`stock/[ticker]/page.tsx` 업종 대비 밸류에 "업종 분류는 오른스코어 내부 분류 기준이며 공식 KRX 업종과 다를 수 있습니다" 캡션. `sectorOf`/`sectorValueScore` 무변경(문구만). 공식 업종(KRX/WICS/GICS) 연동=중기 로드맵(데이터 소스 문서) |
| G §21 [P2-5] 개인정보 국외 이전 표 | ① | **Task 62**: `privacy/page.tsx` 국외 이전 `<ul>`→`<table>`(overflow-x-auto·min-w-[480px]·이전받는 자/국가/항목/목적/시점/보유기간/거부방법, Supabase·Vercel·Resend·Anthropic 4행). Kakao 국내 주석·Anthropic 학습 미사용 보존 |
| G §22 [P2-6] AI 분석 실행 전 고지 | ① | **Task 62**: `AiAnalysisCard.tsx` 실행 전 고지 문구 강화(데이터 Anthropic 전송·민감정보 금지·참고용) + **필수 동의 체크박스**(미동의 시 실행 버튼 disabled). 결과 하단 고지 2종 기존 유지. 순수 클라 상태(API/비용 경로 무변경) |
| G §20 [P2] 유료 정책 확정 필요 항목 | ②/⑤ | **Task 62**: `terms/page.tsx` "유료 서비스 — 출시 전 확정 필요 항목(초안·미확정)" 블록(결제수단·주기·자동갱신·해지시점·환불·7일 청약철회·디지털 콘텐츠 환불제한·장애보상·정산 9항). 확정 가격 0. `legal-ai-commercial-readiness.md` A절과 정렬 |
| H §23 [P2-6] 모바일 하단 탭 관심 종목 | ① | **Task 62**: `MobileBottomNav.tsx` `/watchlist`(관심) MORE→PRIMARY 승격(4 primary: 오늘·종목 찾기·공시 신호·관심 + 더보기), `grid-cols-4`→`grid-cols-5`. Heart 아이콘·active·HIDE 유지 |
| H §24 [P2-7] PWA 기본 적용 | ①/④ | **Task 62**: `manifest.ts`(Next-native·standalone·다크 테마·icon.svg) + `/offline` 안내. **Task 72(앱 준비도)**: manifest에 `id`·`categories:["finance"]`·`dir`·`shortcuts`(오늘/종목/공시) 무에셋 보강, `/about`에 비마케팅 "앱처럼 설치하기" 섹션(iOS/Android 단계·`/offline` 링크·스토어 미확정 명시), `docs/app-roadmap.md` 신규(감사표·네이티브 경로 PWA→TWA→iOS→Capacitor·SW 미등록 결정+미래 안전형·앱 기능별 인증 준비도). **service worker는 데이터 신선도 충돌 회피로 여전히 미등록**, PNG 192/512·maskable·apple-touch-icon은 운영자 보강(④), 스토어 계정·TWA/래퍼 패키징(④/⑤). **Task 77(패키징 준비도)**: `docs/app-packaging-readiness.md` 신규(결정 트리·경로별 에셋/비용/QA 게이트/반려 리스크 표·실기기 사전 점검 체크리스트) + 안전한 `docs/templates/assetlinks.example.json`(자리표시자·**서빙 안 함**, `public/.well-known` 미생성). 스토어 출시·계정($25/$99)·실 서명 지문·실기기 QA는 여전히 ④/⑤(운영자 게이트). **Task 128(Android TWA 운영자 인테이크)**: `docs/ornscore-android-twa-owner-checklist.md` 신규 — Play 등재 다음 단계 6개 입력값(계정 준비도·패키지명 확정·서명 SHA-256·스크린샷·스토어 문구·OAuth 콜백)을 fill-in 빈칸으로(기존 문서는 링크로만 참조). `scripts/check-app-packaging.mjs`가 `generate-assetlinks.mjs --dry-run`을 오프라인 실행해 유효 지문 exit 0/자리표시자 non-zero/실행 후 `public/.well-known` 미생성을 단언하고, 신규 인테이크 문서 존재+패키지명+assetlinks 명령 드리프트를 가드. assetlinks 실값/스토어 제출/계정은 여전히 ④/⑤(운영자 게이트). **Task 145(모바일 리스팅 준비 팩)**: `docs/ornscore-mobile-listing-prep-pack.md` 신규 — 현재 표면 감사(이름·태그라인·privacy/terms·모바일 우선 가치, `file:line` 근거) + 정제 한국어 리스팅 카피 6블록(짧은 요약·긴 설명·기능 불릿·안전 고지·스크린샷 체크리스트·오너 다음 단계) + PWA/메타데이터 로컬 감사표. `app-store-submission-pack.md`는 정식 초안 원본으로 링크만(복사 안 함). 결정=**문서화 전용**(소스 무변경): 남은 갭(OG/Twitter 공유 이미지·manifest `screenshots[]`·캡처 스크린샷)은 전부 에셋 선행 필요 → ⑤ 오너/디자인 게이트로 기록, 코드 결함 아님. 확정 가격/Pro·자동갱신 미기재 |
| I P1/P2 티켓 | ③/④/⑤ | 위 PART B~H 매핑 참조 |

## P1 follow-up (Task 66 — codex P0 1~6 이후 사용자 리뷰)

| 항목 | 상태 | 근거 / 비고 |
|---|---|---|
| 66-1 홈 공시 표시 정책 명시 | ① | **Task 66**: `home/DisclosureSignalSection.tsx` `universeCount` prop + "표시 정책" 박스(홈=분석 대상 {count}종목 공시만 우선, 전체 시장은 `/disclosures` 범위 전환). `page.tsx`에서 `dataMetadata.count` 전달. 홈 공시는 이미 universe 필터(§15/Task 61) → 정책을 명시 노출. 호재/악재 프레이밍 0, 신뢰도=분류 신뢰도 유지 |
| 66-2 공시 범위 버튼 명확화 | ① | **Task 66**: `DisclosureExplorer.tsx` 범위 알약→세그먼트 버튼 그룹(role=group·min-h-[38px]·선택 filled+shadow+ring·카운트 배지 대비·`aria-pressed` 유지) + 도움말 캡션. 기본 `scope="all"`·필터/카운트 로직 무변경·flex-wrap 390px 가드 |
| 66-3 베타→Pro 전환 안내 노출 | ①/④ | **Task 66**: `pricing/page.tsx` 카드↔비교표 사이 sky 톤 전용 콜아웃(알림은 베타 무료·정식 출시 시 Pro 전환 예정·시점/가격 미확정·사전 공지). `pricing.ts` 단일 출처 유지. **가격 확정·결제 게이트는 ④/⑤** |
| 66-4 약관 카피 정리 | ①/⑤ | **Task 66**: `terms/page.tsx` 상단 "현재 적용되는 정책(상용화 전)" 박스로 **확정 사실만 firm**(유료 미제공·전 기능 무료/매직링크·카카오·비밀번호 미저장/공개 데이터 출처·비자문). 결제·환불·청약철회는 기존 "출시 전 확정 필요(초안·미확정)" 블록 유지(**해결 표시 안 함**). `legal-ai-commercial-readiness.md` §F에 잔여 법무 확정 리스크 기록 — **법무 검토 완료 아님(⑤)** |
| 66-5 개인정보 표 모바일 QA | ① | **Task 66**: `privacy/page.tsx` §5-1 국외 이전 표(7열, 이미 overflow-x-auto·min-w-[480px]) 구조 무변경 + 모바일 전용 스크롤 어포던스 1줄(`md:hidden`). 표 콘텐츠·열 수 무변경. 390px 픽셀 육안은 운영자 게이트(Playwright 미구성) |

## 3차 QA P0 (Task 68 — `ORNSCORE_3rd_QA_improvement_spec.md` PART A·F)

> 설계서는 공개 사이트 기준 재검수. P0-1~4는 직전 배포(`743873a`)에서 이미 마감 → Task 68은 **재검증 + P0-5 문구 마감**.

| 항목 | 상태 | 근거 / 비고 |
|---|---|---|
| P0-1 종목 상세 CTA 버튼 붙음 | ① | **이미 완료(`743873a`)** — `stock/StockDetailActionButtons.tsx` 공통 컴포넌트(grid 1/2/4열·gap-2·min-h-44px·테두리/아이콘). **Task 68 재검증**: SSR 글루 `공시 확인재무 보기점수 근거업종 비교` 0건 |
| P0-2 초보자 STEP 가이드 한 줄 붙음 | ① | **이미 완료(`743873a`)** — `BeginnerReading.tsx` `StepCard` 3카드 그리드(`grid-cols-1 md:grid-cols-3`·STEP n 단일 배지·제목/본문 분리). **Task 68 재검증**: SSR STEP 카드 렌더, 한 줄 글루 0 |
| P0-3 데이터 품질 배지 붙음 | ① | **이미 완료(`743873a`)** — `stock/PriorityScoreCard.tsx` 독립 `DataStatusPill` 3종(flex-wrap gap·필수 데이터 N%/이상값 점검 통과/Metrics). **Task 68 재검증**: SSR 글루 `필수 데이터 100%이상값 점검 통과 Metrics 2.4` 0건 |
| P0-4 비교 페이지 빈 상태 미완성 | ① | **이미 완료(`743873a`·#36·#41)** — `CompareClient.tsx` 빈 상태 검색·추천 비교 세트·최근 본·관심 종목 추가 UI. **Task 68 재검증**: `/compare` 200 |
| P0-5 남은 행동성 "매수" 문구 | ① | **Task 68**: `metricReadings.ts:49` 추세 약세 구간 "저가 매수일지 추가 하락일지 판단 필요" → "반등 근거와 추가 하락 위험을 함께 확인"(§7.3 안2, 종목 상세 공유 단일 소스) + `theme/[slug]/page.tsx` `evaluate()` "매수 검토/분할 매수/매수 매력" 3줄 확인·검토 톤 중립화. 고지 "매수·매도 추천이 아닙니다"는 보존 |

> PART B P1(§8~12)은 Task 61·66에서 다수 반영(§8 종목 탐색 밀도·§11 베타→Pro). PART C P2·D~G는 위 §1·§2 표와 중복 추적. PART F QA 체크리스트는 운영자 390px 육안 게이트(Playwright 미구성).

## 최종 점검 P0 (`ornscore_reaudit_2026-06-29_final_check.md` §3 — Task 108·109)

> 최종 배포 전 재검수. P0 2건만 마감 대상.

| 항목 | 상태 | 근거 / 비고 |
|---|---|---|
| P0-1 페이지별 데이터 기준일 불일치(홈 06.29 vs 종목 상세 등 06.26) | ① | **Task 108**: 종목 상세 `priceAsOf`(per-stock 가격 시계열 마지막 거래일)를 전역 스냅샷(`formatBizDateLong(dataMetadata.asOfBusinessDate)`)과 비교→정상이면 hero/`LivePrice`/`DataBasisCard` 모두 `globalAsOf`로 A안 통일, 실제 더 과거면 `priceBasisLagCopy`로 명시. 나머지 라우트는 이미 전역 스냅샷. 현재 138종목 가격 마지막 점 모두 `2026-06-29` → 전 종목 정상 분기. 자세히=`PROGRESS.md`/`AI_HANDOFF.md` Task 108 |
| P0-2 종목 탐색 123/138 필터 문구 충돌(기본 필터 vs 상세 필터 vs 결과 수) | ① | **Task 109**: `copy/stocks.ts`(ko/en)에 `qualityHeadline`("기본 품질 필터 적용 중: 123개 / 전체 138개")·`viewAllToggle`/`backToDefaultToggle`·현재 조건 3행(`qualityRowOn·Off`/`detailRowLabel·None`/`sortRowLabel`)·`backToDefaultReset`·`noMaxPlaceholder` 신설, `baseScreenNote`·`describeAll(shown<total)` 개정("현재 123개 …, 전체 138개를 보려면 기본 품질 필터를 해제하세요" — 기존 "전체 138개 보고 있다" 충돌 제거). `StocksExplorer.tsx`에 `NO_MAX`·`qualityFilterOn`·`pureBrowse`·`viewAllStocks/backToDefaultView`·`sortOptionLabel()` 추가 → 헤더 헤드라인+전체/기본 토글(390px flex-wrap·whitespace-nowrap), 현재 조건 3행 블록(기본 품질 ≠ 사용자 상세 명확화), PER/PBR 상한 NO_MAX 가드, 빈 상태 보조 버튼 라벨 138 약속 오인 제거. 실 카운트 123/138 동적(하드코딩 0). 점수식·`matchConfig`·`savedSearches` 무변경. 자세히=`PROGRESS.md`/`AI_HANDOFF.md` Task 109 |

## 최종 점검 P1 (`ornscore_reaudit_2026-06-29_final_check.md` §4 — Task 110)

> 출시 전 신뢰 문구 폴리시. 표시/문구 + localStorage 방어만(데이터·산식·정렬 무변경).

| 항목 | 상태 | 근거 / 비고 |
|---|---|---|
| P1-1 `/watchlist` 빈 상태가 "불러오는 중…"만 남음 | ① | **Task 110**: 인터랙티브 빈 상태(아직 관심 종목 없음 + 검색 + `/stocks`·`/today` CTA + 비로그인 로그인 동기화 CTA + 헤더 브라우저저장 vs 로그인동기화 설명 + `<noscript>` fallback)는 Task 100서 이미 충족 — 검증(loading→empty 전환, 로딩 텍스트 고착 아님). 추가로 `WatchlistClient.tsx` `view` 읽기/`changeView` 쓰기 try/catch 래핑(시크릿·저장소 차단 graceful). 자세히=`PROGRESS.md`/`AI_HANDOFF.md` Task 110. **Task 161(로그인+계정 신뢰 표면 폴리시)**: 로그인/계정 UX 신뢰감 로컬 패스 — `login/page.tsx` 동의·"광고 안 보냄" 하드코딩 로케일 분기를 `loginCopy` 키로 단일화 + OAuth/이메일 버튼 `aria-busy`+`Loader2` 스피너·비활성 시각화·44px, `UserMenu.tsx` `useLanguage()` 전환+`isLoggingOut`(로그아웃 진행 중 disable+스피너, 더블클릭 방지), `WelcomeToast.tsx` i18n(`welcomeToast` 카피), `WatchlistClient.tsx` 로그인 동기화 CTA를 `auth.syncCta` 키로 로케일화, `i18n.ts` `commonCopy.auth`에 계정/웰컴/`legalAnd` 간격내장 키 추가(양 로케일 tsc 강제). 제공자 `enabled`·콘솔·인증 호출/`redirectTo` 무변경·신규 제공자 0·금칙어 0. **WatchlistClient 전체 EN i18n은 잔여**(syncCta 1줄만 로케일화). 자세히=`PROGRESS.md`/`AI_HANDOFF.md` Task 161 |
| P1-2 홈/상세 순위 기준 차이 설명 강화 | ① | **Task 110**: 홈 후보 배지("오늘 후보 순위 · 검증 보류 제외 기준")는 Task 100(`home.ts` `tag`/`rankCriteria`/`rankBadgeAria`) 이미 충족 — 검증만. 종목 상세는 `priorityScoreCardCopy.scopeNote(n)`(ko+en) 신설 → `PriorityScoreCard.tsx` 순위 줄 아래 동적 `poolN`로 "전체 N종목 기준 상대순위 · 홈 후보 순위와 다를 수 있음" 캡션 |
| P1-3 요금제 베타→Pro 전환 비확정 톤 | ① | **Task 110**: `copy/pricing.ts` `betaCard`(ko+en) "전환될 **예정**"→"전환될 **수 있습니다**"(en "planned"→"may"), `compare.footer2b`(ko+en) "전환될 예정입니다"→"전환될 수 있고 전환 전 사전 안내합니다". 미확정 가격·사전 공지 보존, 가격값 추가 0 |
| P1-4 공시 `강도` 용어 + 기간 배지 | ① | **Task 110**: `signalGuide.ts:54`·`copy/disclosures.ts` `cautionFallbackByType.insider_buy`(ko+en) 첫 노출어 `'강도'`→`'분류 신뢰도(자동분류 확신도)'`(호재 점수 아님·방향 DART 원문 보존). `disclosureExplorerCopy.periodScopeBadge`(ko+en) 신설 → `DisclosureExplorer.tsx` 기간 버튼 행 끝 "선택 기간 전체 아님 · 최신 200건 내" 배지. `strength`/정렬/`direction` 무변경 |
| P1-5 `/status` "후속 과제" 내부 TODO 톤 | ① | **Task 110**: `copy/status.ts` `selfcheckFootnote`(ko+en) "점검 이력 보관·관리자 대시보드·수동 재수집은 후속 과제입니다(현재는 배포 시점 스냅샷)"→"현재는 배포 시점 기준의 스냅샷 점검 결과를 제공하며, 점검 이력과 재수집 상태도 앞으로 단계적으로 공개할 예정입니다." 잔여 `후속 과제` 2건(`dataStatus.ts` 백테스트 생존편향·KRX 업종코드)은 '알려진 제한' 기술 고지로 다른 맥락 — 무변경(운영자 후속 옵션) |

---

# 다음 큐 제안 (남은 ③/④/⑤만 — 이미 완료된 홈·상세·필터·데이터신뢰·Phase 7은 중복 구현 금지)

우선순위는 (a) 사용자 신뢰·상용화 준비도에 직접 기여, (b) 작은 표시/문구로 빠르게 닫을 수 있는지, (c) 큰 데이터·결제·법무 의존도 순으로 정렬.

## A. 작게 구현 가능 — 다음 자동화 큐 후보 (③, [개발])

표시·문구·소규모 컴포넌트 수준. 데이터 산식·`stocks.json`·`direction` 무변경으로 가능.

1. **종목 탐색 필터 감각화 마감(설계서 7)** — 질문형 프리셋 카드화(설명+조건 배지+현재 결과 수), 현재 조건 요약 바 자연어 한 줄 설명, 상세 필터 "예상 결과 수" 실시간 표시. 설계서 7의 ③ 항목을 한 큐로 묶음. *가장 손이 작고 차별점이 큰 영역.*
2. **데이터 신뢰 배지 마감(설계서 3)** — 5단계 상태 라벨/색 풀세트 정렬, 페이지 헤더 상단 인라인 DataTrustBar 확장(현재 헤더 모달+푸터), 기준일 페이지 간 자동 비교 단언. 표시 레벨.
3. **산식 버전 불일치 빌드 게이트(설계서 3, §8)** — 현재 런타임 `selfCheck`만 → 빌드/CI 스크립트에서 `EXPECTED_METRICS_VERSION` vs `stocks.json` 메타 불일치 시 빌드 실패. 작은 스크립트.
4. **오류 신고 진입점 확대(설계서 1 §46 일부 / 2 §4.3)** — 공시 카드·점수 영역·백테스트에 인라인 "신고" mailto 버튼(현재 `/status#report` 단일). 저장은 제외(④). 표시 레벨.
5. **로딩 스켈레톤 표준화(설계서 4 §20.4)** — 오늘 Top3·종목 리스트·공시·차트·상세 점수 카드 스켈레톤 공통화.
6. **압축형 보기·모바일 바텀시트 필터(설계서 7 §11·§17)** — 탐색 결과 압축 보기 추가, 모바일 필터 바텀시트 인터랙션.

## B. 큰 제품/데이터 의사결정 (④, [제품]/[개발])

큰 작업이므로 자동화 큐 단독 처리보다 제품 결정 후 분리 착수 권장.

7. **공시 전체 기간 수집 파이프라인(설계서 1 §19.2 / 2 §6)** — DART pagination 전체 기간 수집·저장. 현재 200건 임시안. *공시가 핵심 차별점이라 ROI 높음.*
8. **KRX 공식 업종코드 매핑(설계서 1 §J)** — 현재 테마 휴리스틱 → 공식 코드. 업종 밸류 피어 표본 확대로 "참고만" 종목 감소. 종합점수 업종 보정(§35.2)은 산식 변경이라 별도 결정.
9. **관리자 데이터 상태판 + 오류 신고 저장소(설계서 1 §45·§46 / 2 §4.4·§14)** — 수집 성공률·누락·API 오류 로그·수동 재수집·신고 영속 저장. 신규 시스템(Supabase 테이블+관리자 라우트).
10. **점수 변화 히스토리·급변 알림 라이브화(설계서 2 §5.3·§5.4)** — 시계열 축적·급변 사유 자동화·메일 발송 라이브. cron 골격 존재 → 운영 결정·임계 튜닝 필요.
11. **공시 중요도 점수·공시 후 반응 통계(설계서 2 §6.2·§6.4)** — 이벤트 스터디 데이터 필요. 큰 작업.
12. **백테스트 생존편향 실해결(설계서 1 §E / 2 §9.1)** — 시점별 유니버스 재구성. 현재 면책 문구.
13. **종목 커버리지 확대 138→500→전체(설계서 2 §10)** — 데이터 품질 관리 동반 필요.
14. **Premium 3티어·결제/구독·권한(설계서 1 §K / 2 §11·§15)** — **정보구조·기능 비교표·미확정 가격 안전 정리는 Task 46에서 완료(①)**. 남은 건 **가격 확정·실제 결제 연동·구독 권한 게이트(④, 제품+사업 결정)**.
15. **개인화 대시보드·관심종목 고도화(설계서 2 §8 / 5 3차)** — 그룹·메모·CSV·맞춤 브리핑 위젯.

## C. 사람/법무/사업 확인 필요 (⑤, [법무·사업])

개발 단독으로 끝낼 수 없음. 문서로 추적만 하고 결정 대기.

16. **데이터 소스 약관·라이선스 결론(설계서 1 §L / 2 §13)** — KRX 상용 시세 라이선스, Naver 비공식 수집 대체, yfinance/FDR 상용 리스크. `docs/data-source-commercial-risk.md`에 [법무] 항목 정리됨 → 원문 대조·판단 대기.
17. **결제/환불/청약철회 약관 확정(설계서 1 §M / 2 §13)** — 결제 라이브 전 [법무] 확정. terms 현재 "출시 예정 초안". `docs/legal-ai-commercial-readiness.md` 추적.
18. **실 브라우저 모바일/데스크톱 시각 게이트(설계서 1 §O QA)** — Playwright 미구성 → 운영자 육안 게이트. #38·#40·#41 공통 잔여.

---

## 요약

- 사용자가 준 **7개 설계서 전 항목이 이 문서 한 곳에서 추적**됨. 7개 .md 원문은 이번에 전수 정독함.
- **1차 안정화(설계서 1)·홈(5)·상세 결론 카드(6)·데이터 신뢰(3)·디자인 Phase 1~7(4)·탐색 필터(7) 핵심은 #14~#41에서 대부분 ① 완료**. 중복 구현 금지 대상.
- **남은 상용화 고도화는 대부분 설계서 2(상용화 고도화)** — 관리자 시스템·결제·알림 라이브·커버리지 확대·공시 파이프라인 등 큰 작업(④)과 법무 판단(⑤)이 핵심.
- **다음 자동화 큐는 위 A절(③)을 먼저** 권장: 손이 작고 사용자 체감·차별점이 큼(탐색 필터 감각화 마감 → 데이터 신뢰 배지 마감 → 산식 빌드 게이트 → 오류 신고 진입점 → 스켈레톤 → 압축/바텀시트).
