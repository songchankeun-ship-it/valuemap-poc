# 오른스코어 안정화·고도화 PROGRESS

> 최종 설계서(33섹션) 기준 진행 추적. 세션이 끊겨도 이 파일로 이어간다.
> 규칙: 작은 단위 plan→실행→검증(구문/compile)→기록. 위험한 것만 사용자 확인.
> 검증 도구: `node /tmp/syntaxcheck.js`(TS 구문) · `python3 scripts/verify_metrics.py`(데이터+브랜드 게이트) · Vercel 빌드(최종 타입게이트).
> 제약: OneDrive 폴더 → python/bash로만 편집(Edit 도구 한글 깨짐). 대괄호 경로 git add는 `--literal-pathspecs`. push 전 `git pull`(봇이 매일 커밋).

## 2026-06-23 · Pass 10 공시 enrich 공통 util 추출 — 중복 축소 리팩터 (Task 33, Claude)
- 목표: Pass 9가 '다음 패스 (b)'로 남긴 "6개 enrichX lib의 lazy-load·rcept_no 매칭·원→억원 헬퍼를 단일 util로 통합해 중복 축소"를 해소. 동작·점수·신호·노출 문자열 전부 무변경(순수 내부 리팩터). 라우트 2종은 손대지 않음.
- 변경 파일/내용:
  - ⭐ `src/lib/signalDetailsShared.ts` 신설 — 5개 enrich lib이 각자 복붙하던 공통 3종을 한 곳으로: (a) `loadSignalFile<T>(filename)` — 모듈 단위 `Map<string, unknown>` 캐시로 같은 `public/data/*-signals.json`을 최대 1회만 `fs.existsSync`+try/catch로 읽고 없으면 graceful `{}` 반환(파일이 없는 경우도 캐시해 재시도 방지). (b) `matchRow<T extends {rcept_no?: string}>(rows, rceptNo)` = `rows.find(r=>r.rcept_no===rceptNo) ?? rows[0]`. (c) `toEok(won)` = `Math.round(won/1e8)`. enrichX 고유 로직(signalType 가드·note 문자열)은 util에 두지 않음.
  - `src/lib/{insider,treasury,capital,contract,correction}Details.ts` 5종 리팩터 — 각자 갖던 `let cache`/`let loaded`/`function load()`(15줄)와 `rows.find(...) ?? rows[0]`, `Math.round(x/1e8)`을 shared util 호출로 위임. 각 파일의 `import fs`/`import path` 제거(이제 shared가 담당). 각 `enrichX(...)` 시그니처·signalType 가드·strength/direction 처리·생성 note 문자열(`취득예정`/`발행규모`/`계약금액`/`직전매출 대비`/`정정 전 … → 정정 후`/`보유 …주·비율 …%`/`장내매수 확인`) **전부 바이트 동일**. `matchRow`가 `T | undefined`를 반환하므로(빈 배열 honest 타입) 각 lib에 절대 발화 안 되는 `if (!match) return signal;` 가드 1줄 추가(rows 비어있지 않음이 직전에 보장되어 런타임 무영향·출력 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — **무변경**(export된 `enrichX` 시그니처 그대로 소비).
- 카피 안전: 신규 사용자 노출 문자열 0(util 주석만 추가, note 문자열 무변경). verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·6 lib 타입 통일 확인·종목 138p 프리렌더, exit 0 — 리팩터가 컴파일·타입 정합됨을 보증하는 1차 게이트) / 공유 서버 청크 `.next/server/chunks/7381.js`에 6종 포맷(`취득예정`·`발행규모`·`계약금액`·`정정 전`·`직전매출 대비`·`장내매수 확인`) 전부 잔존 확인 / 로컬 프로덕션 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample·error null·signalCount 12)·`/005930`(source=cache·error null·signalCount 3) 200 = shared 로더가 graceful no-op 경로를 보존함 확인(로컬에 *-signals.json 없음).
- 위험/한계: 순수 리팩터라 외부 동작 변화 없음. `*-signals.json` 미존재 시 enrich 미노출은 정상 graceful no-op(이전과 동일). 운영자 전용 잔여는 그대로: DART 키로 fetch 스크립트 실행해 `*-signals.json` 생성, 단일계약·정정의 `⚠️ operator-verify` 정규식 실보고서 대조.
- 다음 패스(2개·구체·로컬 검증 가능): (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 검증 가능. (b) 각 lib의 `*Clause()` 빌더가 공유하는 "parts를 ` · `로 join" 패턴을 공통화하거나, `toEok`/`matchRow`에 단위 수준 assertion 추가.

## 2026-06-23 · Pass 9 공시 핵심 숫자 — 정정(correction) 본문 정정 전/후 수치 (Task 31, Claude)
- 목표: Pass 8이 '다음 패스'로 남긴 '본문 XML 스캐폴드 패턴을 correction enrich로 확장'을 해소. 단일계약(Pass 8 contractDetails)과 동일한 §18.2 document.xml 본문 파싱 + graceful 앱 경로를 정정공시에 적용. 구조화 엔드포인트가 없는 마지막 비구조화 경로(단일계약·정정) 중 정정을 메움. 투자 로직·점수·신호 강도 전부 무변경, 사실 수치만.
- 변경 파일/내용:
  - ⭐ `src/lib/correctionDetails.ts` 신설 — `contractDetails.ts` 미러. `correction-signals.json` lazy try/catch 로드(없으면 `{}` → graceful no-op). `CorrectionRow {rcept_no, field?, before?, after?, date?}`. `correctionClause()`는 before·after가 모두 유한 숫자이고 억원 반올림 후 서로 다를 때만 ` · {항목명 }정정 전 X억원 → 정정 후 Y억원` 사실 절 생성(원→억원 형제 enrich와 동일 단위, 손실 정정 대비 부호 보존, null/NaN/하이픈 방어, 동일값이면 생략). `enrichCorrection(stockCode, signal)`는 `signal.signalType==="correction"` + 매칭 행(`rcept_no` 일치, 폴백 `rows[0]`)일 때만 `signal.note`에 절 덧붙임. `strength`·`direction`·점수·타입·다른 파일 무변경. `fs`/`path` import만.
  - ⭐ `scripts/fetch_correction_details.py` 신설 — `fetch_contract_details.py` 미러(운영 전용, 로컬 미실행). `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, `RE_REPORT_NM=re.compile("정정")`, list.json으로 정정 보고서 rcept_no 수집 → `document.xml`(zip) 다운로드 → 태그 제거 평문화 → `RE_BEFORE`/`RE_AFTER`(정정 전/후 원 단위 수치, 콤마·음수 허용)·`RE_FIELD`(손익 항목명) 추출 → `public/data/correction-signals.json`(ticker → `[{rcept_no, field, before, after, date}]`). 전·후 값이 모두 있어야 행 생성(graceful skip). per-call `time.sleep(0.12)` 한도 보호. **본문 양식·정규식·zip 여부 전부 `⚠️ operator-verify`** — 정정공시는 정정사유만 서술하고 수치표가 없는 경우도 많아 실보고서 1~2건으로 확인 후 교정 필수.
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — `enrichCorrection`을 최외곽 래퍼로 추가(`enrichCorrection(code, enrichContract(code, enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))))`). recent 라우트 `!` non-null 단언·ticker 라우트 인자 형태 각각 보존. UI/컴포넌트 편집 0건(`StockDisclosures.tsx`가 이미 `signal.note` 렌더).
- 카피 안전: 신규 문자열(`정정 전 X억원 → 정정 후 Y억원`·항목명)은 숫자·항목 사실만 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더, exit 0) / 공유 서버 청크 `.next/server/chunks/7381.js`에 신규 포맷(`정정 전 ${...}억원 → 정정 후`)이 형제 절(`계약금액`·`발행규모`·`취득예정`)과 함께 존재 확인 / 로컬 프로덕션 서버(127.0.0.1:3100, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인(로컬에 correction-signals.json 없음).
- 위험/한계: 정정 절은 `correction-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체). 정정 본문은 양식 편차가 커 RE_BEFORE/RE_AFTER/RE_FIELD가 추정 단계 — 운영 키 실호출 검증 전엔 활성화 보류.
- 남은 블로커(운영자 전용): 송님이 DART 키로 `python scripts/fetch_correction_details.py` 실행 → `public/data/correction-signals.json` 생성 후, `⚠️ operator-verify` 정규식을 실제 정정보고서 1~2건 본문과 대조해 매핑만 교정. (구조화 엔드포인트 5종=임원·자기주식·유증·CB·BW는 enrich 경로 확보 완료, 비구조화 2종=단일계약·정정은 본문 스캐폴드 완료·정규식 운영 검증 대기.)
- 다음 패스(2개·구체·로컬 검증 가능): (a) 공시 explorer 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 빌드·렌더로 검증 가능. (b) 6개 `enrichX` lib(insider·treasury·capital·contract·correction + 공통)의 lazy-load·원→억원 헬퍼를 단일 util로 통합해 중복 축소 — 리팩터, 타입게이트로 검증 가능.

## 2026-06-23 · Pass 8(Campaign 8) 공시 데이터 신뢰도 — BW 구조화 enrich + 단일계약 본문 XML 스캐폴드 (Task 29, Claude)
- 목표: Pass 7이 마감한 '구조화 엔드포인트 4종(임원·자기주식·유증·CB)' 위에, ① 같은 구조화 패턴으로 **신주인수권부사채(BW)** 한 종을 더 메우고(완전 구현·저위험), ② 남은 유일한 비구조화 경로인 **단일계약 본문(document.xml) 파싱**을 오프라인 스캐폴드+graceful 앱 경로로 착수. 투자 로직·점수·신호 강도 전부 무변경, 사실 숫자만.
- PRIMARY(완전 구현):
  - `src/lib/disclosure-signals.ts` — `RE_BW = /신주인수권부사채[권]?\s*발행/` 추가, `detectCapitalRaise`가 `isBw`도 수용(`kind = isRights ? "유상증자" : isCb ? "전환사채" : "신주인수권부사채"`). signalLabel은 `${kind} 발행`, strength 65 유지(다른 디텍터 무변경). RE_CB(`전환사채…`)와 RE_BW(`신주인수권부사채…`)는 서로 매칭 안 됨.
  - `scripts/fetch_capital_details.py` — `fetch_bw(key,corp,bgn,end)` 신설(`bwbdIsDecsn.json` 미러, 권면총액 `bd_fta`·자금목적 `fdpp_*` 동일 구조), 종목당 rows = 유증+CB+BW(호출 3회). `bd_fta`·행사기간(`ex_pd_bgd/edd`) 필드는 `⚠️ operator-verify` 주석. **로컬 실행 안 함**(키·원격호출 없음).
  - `src/lib/capitalDetails.ts` — 무변경. kind/amount/fundsUse에 대해 이미 일반적이라 BW 행(kind="신주인수권부사채")이 그대로 통과(재확인 완료).
  - UI 보라 배지: `StockDisclosures.tsx`(SIGNAL_BG)·`DisclosureExplorer.tsx`(SIGNAL_STYLES+SIGNAL_DESCRIPTIONS)에 `"신주인수권부사채 발행"` 보라 항목 추가(유증/CB와 동일 팔레트). 누락 시에도 zinc 폴백이라 graceful.
- SECONDARY(오프라인 스캐폴드 + 문서화된 블로커용 graceful 앱 경로):
  - ⭐ `scripts/fetch_contract_details.py` 신설 — 설계서 §18.2 본문 파싱 스캐폴드. list.json으로 '단일판매·공급계약' 보고서 rcept_no 수집 → `document.xml`(zip) 다운로드 → 태그 제거 평문화 → 정규식으로 계약금액(원)·직전매출 대비 비율(%) 추출 → `public/data/contract-signals.json`(ticker → `[{rcept_no, amount, salesRatio, date}]`). `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용. **본문 양식·정규식(RE_AMOUNT/RE_RATIO)·zip 여부는 전부 `⚠️ operator-verify`** — 실보고서로 확인 후 교정. **로컬 실행 안 함.**
  - ⭐ `src/lib/contractDetails.ts` 신설 — `capitalDetails.ts` 미러. `contract-signals.json` lazy try/catch 로드(없으면 `{}` → graceful no-op), `enrichContract(stockCode, signal)`는 `signalType==="single_contract"` + 매칭 행이 있을 때만 `· 계약금액 X억원 · 직전매출 대비 Y%` 사실 절 덧붙임(원→억원 반올림, salesRatio 유한 양수 가드, null/빈값 방어). 다른 파일·SignalHit 타입 무변경.
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — `enrichContract`를 최외곽 래퍼로 추가(`enrichContract(code, enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig))))`). recent 라우트의 `!` non-null 단언 보존. UI 렌더 변경 0(note 한 줄 기존 렌더).
- 카피 안전: 신규 문자열(`신주인수권부사채 발행`·`계약금액 X억원`·`직전매출 대비 Y%`)은 숫자·기관/계약 사실만 — 매수/매도/추천/호재 판단어 없음. verify_metrics 금칙어 게이트 무충돌.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(타입게이트 통과·종목 138p 프리렌더) / 공유 서버 청크 `.next/server/chunks/5337.js`에 신규 포맷(`신주인수권부사채`·`계약금액`·`직전매출 대비`)이 Pass 7 `발행규모` 절과 함께 존재 확인(enrich는 서버 라우트 코드) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인(로컬에 capital/contract-signals.json 없음).
- 위험/한계: BW 절·계약 절은 각각 `capital-signals.json`(BW 포함)·`contract-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, sample에 가짜 수치 주입은 오인 위험이라 의도적으로 안 함). 단일계약 본문 파싱은 보고서 양식 편차가 커 정규식이 추정 단계 — 운영 키 실호출 검증 전엔 활성화 보류.
- 남은 블로커(정확화): 구조화 엔드포인트 5종(임원·자기주식·유증·CB·BW) enrich 경로 확보 완료. 단일계약은 본문 스캐폴드까지 깔렸고, 정정(correction) 본문(정정 전후 수치)은 아직 미착수.
- 다음 패스(2개·구체·로컬 검증 가능): (a) 본문 XML 스캐폴드 패턴을 correction(정정) enrich로 확장 — 정정 전후 수치 추출, contractDetails와 동일 graceful 패턴. (b) 공시 explorer 명료화 / 카드별 데이터 신선도(수집 기준일) 라벨 패스 — UI 전용, 로컬에서 빌드·렌더로 검증 가능.

## 2026-06-23 · Pass 7 공시 핵심 숫자 — 증자·전환사채 발행 규모 노출 (Task 27, Claude)
- 목표: Pass 6(treasury_buy)가 '다음 패스'로 남긴 capital_raise(증자·CB)를, 투자 로직 무변경으로 동일한 graceful 패턴으로 한 단계 더. 유상증자/전환사채는 자기주식취득·임원 소유보고와 함께 DART가 **본문 XML 없이 구조화 엔드포인트로 규모를 노출**하는 유형이라 가장 보수적인 다음 step.
- 구조화 엔드포인트 근거: 유상증자(`piicDecsn.json`)·전환사채(`cvbdIsDecsn.json`)는 주요사항보고서 구조화 정보(발행금액·자금조달 목적)를 제공. 단일계약(single_contract)·정정(correction)은 여전히 구조화 엔드포인트가 없어 §18.2 본문 XML 파싱 필요 — 이번 패스는 capital_raise만 한정.
- 변경 파일/내용:
  - ⭐ `scripts/fetch_capital_details.py` 신설 — `fetch_treasury_details.py` 미러. `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, 종목당 `piicDecsn.json`+`cvbdIsDecsn.json` 2회 호출(기간 bgn_de/end_de 필수, 최근 365일) → `public/data/capital-signals.json`(ticker → `[{rcept_no, kind, amount, fundsUse, periodBgn, periodEnd, date}]`, kind∈유상증자/전환사채). **로컬 실행 안 함**(키 없음·원격 호출 없음). 필드명(CB 권면총액 `bd_fta`, 유상증자 자금목적 `fdpp_fclt`/`fdpp_op` 등)은 DART 문서 기준 추정 → "⚠️ operator-verify" 주석으로 운영 키 실호출 검증 요청.
  - ⭐ `src/lib/capitalDetails.ts` 신설 — `treasuryDetails.ts` 미러. `capital-signals.json` lazy-load(try/catch, 파일 없으면 `{}`), `enrichCapital(stockCode, signal)`는 `signal.signalType === "capital_raise"` + 매칭 행이 있을 때만 `capitalClause()`로 사실 절(` · 발행규모 X억원 · 자금용도 시설/운영`, 양수·유한수 가드, 원→억원 반올림, fundsUse는 빈값·`-` 방어한 사실 분류 문자열일 때만) 덧붙임. 없으면 원본 그대로. `strength`·`direction`·점수·신호 로직·다른 파일 무변경. `fs`/`path` import만(형제 lib과 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — 기존 합성에 `enrichCapital`을 최외곽으로 추가(`enrichCapital(code, enrichTreasury(code, enrichInsider(code, sig)))`). UI 편집 0건(`StockDisclosures.tsx`가 이미 `d.signal.note` 한 줄 렌더).
- 카피 안전: 새 문자열(`발행규모 X억원`·`자금용도 …`)은 숫자·사실 분류만 — 증자는 희석 요인이라 호재/악재 판단어를 일절 넣지 않고 규모·용도만 기술. verify_metrics 금칙어 18종(매수/매도/추천/호재 확정 등)과 무충돌, 투자 자문 표현 신규 유입 0.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 공유 서버 청크 `.next/server/chunks/3162.js`에 신규 포맷(`발행규모`·`자금용도`)이 Pass 6 treasury 절(`취득예정`·`취득금액`)과 함께 존재 확인(enrich는 서버 라우트 코드라 공유 server 청크에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`(source=sample)·`/005930`(source=cache) 200·error null = graceful no-op 확인.
- 위험/한계: 새 발행규모 절은 `capital-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임에서 절 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, 데모 sample에 가짜 발행 수치 주입은 사용자 오인 위험이라 의도적으로 안 함). 필드 매핑(`bd_fta`·`fdpp_*`)은 operator-verify 상태 — **송님이 `python scripts/fetch_capital_details.py`(DART 키) 실행** 시 `piicDecsn`/`cvbdIsDecsn` 실응답으로 확인 후 필요 시 매핑만 교정.
- 남은 블로커(정확화): 이제 구조화 엔드포인트가 있는 공시 4종(임원 보유변동·자기주식취득·유상증자·전환사채)은 모두 graceful enrich 경로 확보. 남은 단일계약(계약금액·직전매출 비율)·정정 본문은 구조화 엔드포인트가 없어 여전히 §18.2 DART 보고서 본문(XML) 파싱 파이프라인 필요.
- 다음 패스(1개·구체): single_contract/correction을 위한 §18.2 본문 XML 파서 착수(현재 미구현·유일하게 남은 비구조화 공시 경로). DART `document.xml` 다운로드 → 계약금액·직전매출 비율 추출 스캐폴드부터.

## 2026-06-23 · Pass 6 공시 핵심 숫자 — 자기주식 취득 규모 노출 (Task 25, Claude)
- 목표: Pass 5가 '다음 패스'로 남긴 treasury/contract 핵심 숫자를, 투자 로직 무변경으로 임원 보유변동과 동일한 graceful 패턴으로 한 단계 더. 자기주식 취득은 임원 소유보고(elestock)와 함께 DART가 **본문 XML 없이 구조화 엔드포인트로 규모를 노출**하는 몇 안 되는 유형이라 가장 보수적인 다음 step으로 선택.
- 구조화 엔드포인트 근거: 단일계약(single_contract)·정정(correction)은 구조화 엔드포인트가 없어 여전히 §18.2 본문 XML 파싱이 필요하지만, 자기주식 취득(`tsstkAqDecsn.json`)·증자/CB(`piicDecsn.json`/`cvbdIsDecsn.json`)는 주요사항보고서 구조화 정보가 있음. 이번 패스는 그 중 treasury_buy 신호(`자기주식 취득`)만 한정.
- 변경 파일/내용:
  - ⭐ `scripts/fetch_treasury_details.py` 신설 — `fetch_insider_details.py` 미러. `load_key()`·`build_corp_map()`·`corp_code_map.json` 캐시 재사용, `tsstkAqDecsn.json`(기간 bgn_de/end_de 필수, 최근 365일) 호출 → `public/data/treasury-signals.json`(ticker → `[{rcept_no, acqCnt, acqAmount, periodBgn, periodEnd, date}]`). **로컬 실행 안 함**(키 없음·원격 호출 없음). 필드명(`aqpln_stk_ostk`·`aqpln_prc_ostk`)은 DART 문서 기준 추정 → "⚠️ operator-verify" 주석으로 운영 키 실호출 검증 요청.
  - ⭐ `src/lib/treasuryDetails.ts` 신설 — `insiderDetails.ts` 미러. `treasury-signals.json` lazy-load(try/catch, 파일 없으면 `{}`), `enrichTreasury(stockCode, signal)`는 `signal.signalType === "treasury_buy"` + 매칭 행이 있을 때만 `treasuryClause()`로 사실 절(` · 취득예정 N주 · 취득금액 X억원`, 양수·유한수 가드, 원→억원 반올림) 덧붙임. 없으면 원본 그대로. `strength`·점수·신호 로직·다른 파일 무변경. `fs`/`path` import만(형제 lib과 동일).
  - `src/app/api/disclosures/{[ticker],recent}/route.ts` — 기존 `enrichInsider` 호출을 `enrichTreasury(...)`로 합성(`enrichTreasury(code, enrichInsider(code, sig))`). UI 편집 0건(`StockDisclosures.tsx`가 이미 `d.signal.note` 한 줄 렌더).
- 카피 안전: 새 문자열(`취득예정 N주`·`취득금액 X억원`)은 숫자·사실만 — verify_metrics 금칙어 18종(매수/매도/추천/호재 확정 등)과 무충돌, 투자 자문 표현 신규 유입 0.
- 검증: `python scripts/verify_metrics.py`(PYTHONIOENCODING=utf-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 공유 서버 청크 `.next/server/chunks/2140.js`에 신규 포맷(`취득예정`·`취득금액`·`억원`)이 Pass 5 임원 절(`보유 `·`비율 `·`장내매수 확인`)과 함께 존재 확인(enrich는 서버 라우트 코드라 공유 server 청크에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0, `/api/disclosures/recent`·`/005930` 200(source=sample 폴백).
- 위험/한계: 새 취득 절은 `treasury-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 런타임에서 절 미노출 = 정상 graceful no-op(시각 검증은 server 청크 문자열 존재로 대체, 데모 sample에 가짜 취득 수치 주입은 사용자 오인 위험이라 의도적으로 안 함). 필드 매핑은 operator-verify 상태 — **송님이 `python scripts/fetch_treasury_details.py`(DART 키) 실행 시** 실제 필드 확인 후 활성화.
- 남은 블로커(정확화): 단일계약 계약금액·직전매출 비율, 정정 본문은 구조화 엔드포인트가 없어 여전히 §18.2 DART 보고서 본문(XML) 파싱 파이프라인 필요. 증자·CB는 구조화 엔드포인트(`piicDecsn.json`/`cvbdIsDecsn.json`)가 있어 이번 패턴으로 확장 가능.
- 다음 패스(1개·구체): capital_raise 신호를 증자(`piicDecsn.json`)·CB(`cvbdIsDecsn.json`) 구조화 엔드포인트로 동일 graceful 패턴 확장(발행 규모·자금용도) **또는** single_contract/correction을 위한 §18.2 본문 XML 파서 착수.

## 2026-06-22 · Pass 5 공시 핵심 숫자(보유 수량·비율) 노출 (Task 23, Claude)
- 목표: 공시 카드 유용성을, 투자 로직 무변경으로 한 단계 더. 직전 패스들이 '다음 제안'으로 남긴 '공시 카드 DART 핵심 숫자 노출'을 **이미 수집 스크립트가 쓰고 있으나 앱이 읽지 않던** 임원 보유 수량·비율로 한정해 안전하게 해소.
- 조사 결과(데이터 형태 확인): `scripts/fetch_insider_details.py`가 elestock.json에서 `ownCnt`(보유 수량)·`rate`(보유 비율)를 이미 `insider-signals.json`에 기록 중. 그러나 `src/lib/insiderDetails.ts`의 `InsiderRow`는 이 두 필드를 읽지 않아 화면에 못 떴음. **신규 파싱·본문 XML 없이** 기존 구조화 데이터를 표시만 하면 됨 → 가장 보수적인 useful step.
- 변경 파일/내용(`src/lib/insiderDetails.ts` 단일):
  - `InsiderRow`에 `ownCnt?: number`·`rate?: string` 추가(스크립트가 이미 쓰는 필드).
  - `holdingClause()` 헬퍼 신설: 값이 있을 때만 `· 보유 N주 · 비율 X%` 사실 절 생성(보유수량 양수 + 비율 유한수치 가드, `%`/공백/`-` 방어). 값 없으면 빈 문자열(graceful).
  - `enrichInsider`의 방향 텍스트(`장내매수 확인 (보고자, +N주)` 등)는 그대로 두고 끝에 보유 절만 덧붙임. `strength`·신호 로직·점수·다른 파일 무변경. import·의존성·신규 props 0건(`StockDisclosures.tsx`가 이미 `d.signal.note`를 `text-[11px]` 한 줄로 렌더 → 데이터 있으면 자동 노출).
- 카피는 사실·비자문 유지: 새 문자열(`보유 N주`·`비율 X%`)은 verify_metrics 금칙어 18종과 무충돌, 투자 자문 표현 신규 유입 없음.
- 검증: `python scripts/verify_metrics.py`(UTF-8) 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p, 타입게이트 통과) / 빌드 산출물 `.next/server/app/api/disclosures/{[ticker],recent}/route.js`에 신규 포맷 문자열(`장내매수 확인`·`보유 `·`비율 `) 존재 확인(enrichInsider는 서버 라우트 코드라 client 청크 아닌 server 번들에 위치) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0.
- 위험/한계: 새 보유 절은 `insider-signals.json` 생성 후에만 화면에 뜸. 로컬엔 DART 키·해당 파일이 없어 API가 sample 폴백(`source: cache/sample`) → 임원 note는 휴리스틱 문자열만 보임(런타임에서 보유 절 미노출 = 정상 graceful no-op). 실제 노출은 **송님이 `python scripts/fetch_insider_details.py`(DART 키) 실행해 `public/data/insider-signals.json` 생성 시** 활성화. 시각 검증은 server 번들 문자열 존재로 대체(데모 sample에 가짜 보유수치 주입은 사용자 노출 '예시 표본' 오인 위험이라 의도적으로 안 함).
- 남은 블로커(정확화): 자기주식 취득/처분 수량·금액, 단일계약 계약금액·직전매출 비율, 증자·CB 규모, 정정 본문 등 **나머지 공시 핵심 숫자는 `list.json`에 없고 설계서 §18.2 DART 보고서 본문(XML) 파싱 파이프라인이 미구현이라 여전히 차단**. 임원 보유변동만 elestock 구조화 엔드포인트 덕에 본문 파싱 없이 가능했음.
- 다음 패스(1개·구체): §18.2 본문 파싱 파이프라인 구축 **또는** 유형별 구조화 엔드포인트 추가 수집(예: 자기주식 취득 수량용 `tsstk.json`)로 treasury/contract 핵심 숫자도 동일 graceful 패턴으로 노출.

## 2026-06-22 · Pass 4 공시·데이터 신뢰도 폴리시 (Task 21, Claude)
- 목표: 첫 사용자 관점에서 공시 카드의 팔레트 불일치·정보 부족·신선도 문구를 소폭 다듬어 신뢰감 보강. 투자 로직·산식 무변경, className/카피만. OneDrive 규칙대로 python(utf-8/LF) 편집.
- 직전 패스(Task 18)가 남긴 1순위 항목 '`StockDisclosures` `gray-*`→`zinc-*` 팔레트 통일 + 공시 note 노출' 해소.
- 변경 파일/내용(`src/components/StockDisclosures.tsx` 단일):
  - **팔레트 통일**: 잔존 `gray-*` 13곳 전부 앱 공통 `zinc-*`로 교체(border/text/hover/active/dot). 다크모드 갭 2곳 보강 — `getBadgeClass` 폴백 배지에 `dark:bg-zinc-800 dark:text-zinc-300`, 로딩 스켈레톤 4줄에 `dark:bg-zinc-800` 추가(이전엔 다크에서 흰 막대로 떴음). grep 결과 `gray-` 토큰 0건.
  - **DART 이해도**: 각 공시 카드 배지 행 아래에 이미 계산돼 있던 `d.signal.note`(예: `장내매수 확인 (보고자, +N주)`·`계약금액·직전매출 비율은 본문 확인 권장`)를 muted 한 줄(`text-[11px] text-zinc-500 dark:text-zinc-400`)로 노출. 새 파싱·props·import·의존성 없음(기존 enrich 결과 표시만).
  - **신선도 문구**: 헤더 `최근 90일 {count}건 신호 {signalCount}건` → `최근 90일 · 공시 {count}건 · 신호 {signalCount}건`(구분점으로 가독성만 개선). 빈 상태 중립 학습 문구는 그대로 유지.
- 카피는 학습용·비자문 유지(매수/매도/추천 신규 유입 없음). 노출되는 note 문자열 10종이 금칙어 18종과 충돌 없음 확인(모두 '확인 권장/필요' 중립 톤).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /disclosures /stock/005930` 모두 200·에러 마커 0. 공시 카드는 client+fetch 게이트라 서버 HTML엔 없어 빌드 청크(`app/stock/[ticker]`)에서 신규 zinc 폴백 배지·note 서브라인 클래스·`유형 자동분류` 문자열 존재 확인.
- 위험/한계: 공시 카드는 client 렌더라 헤드리스 브라우저 없이 픽셀 확인 불가(빌드 청크 문자열·클래스 존재로 검증). note 노출은 enrich 데이터(insider-signals.json) 유무에 graceful — 없으면 휴리스틱 note, 있으면 실제 방향·규모.
- 다음 패스 제안(1개): 공시 카드 DART 본문 핵심 숫자(취득/처분 수량·금액·계약금액 비율) 추출 노출 — 설계서 §18.2, 현재 본문 파싱 미구현이라 블로킹.

## 2026-06-22 · Pass 3 daily-use clarity (Task 18, Claude)
- 목표: 첫 사용자 관점에서 여전히 미완성으로 느껴지는 라벨·빈 상태·신선도 표현을 소폭 보강. 기존 작업(워크트리 clean·stash 0) 보존, OneDrive 규칙대로 python(utf-8/LF)로만 편집.
- 점검 6개 화면(home/today/stocks/watchlist/compare/공시·상세): home·today·stocks·관심종목 빈상태·비교 빈상태·StocksExplorer는 이미 1~2차 패스로 명료화 완료 → 무변경. 신선도(홈 히어로 pill·/today 헤더·푸터)는 모두 `dataMetadata`+`isDataStale` 단일 출처 사용 확인. 사용자 노출 '밸류맵/ValueMap' 잔재 0건(grep).
- 변경 파일/카피:
  - `src/components/WatchlistClient.tsx` — '최근 본 종목' 빈 상태가 한 줄뿐이던 것을 가치 설명(방문 종목 자동 기록·다시 찾기 쉬움) + 최근 10개 한도 안내 + '종목 탐색하러 가기' CTA로 보강(디자인 설계서 §7 history 빈상태 🟡 해소).
  - `src/components/StockDisclosures.tsx` — ① 종목별 공시 빈 상태 '공시가 없습니다'에 "공시 없음은 호재도 악재도 아님" 중립 학습 문구 추가(비자문). ② 소스 배지 영어 Live/Cache/Preview → 한글 실시간/저장본/예시 표본 + 의미 title 툴팁 + 다크 변형(이전 '영어라벨 한글화' 기조 일치).
  - `src/components/CompareClient.tsx` — 비교 화면 다크모드 가독성: 지표 막대 값(text-zinc-900 → 다크 미지정으로 어두운 배경에 거의 안 보이던 것)·막대 트랙·재무 표 best/일반 셀·각주 초록 강조·테마 칩에 누락된 `dark:` 변형 추가(레이아웃·로직 무변경, className만).
- 카피는 학습용·균형·비자문 유지(매수/매도/추천 신규 유입 없음).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0, exit 0) / `npm run build` 성공(전 라우트 프리렌더, 종목 138p) / 로컬 프로덕션 서버(127.0.0.1:3000, 내가 띄운 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /today /stocks /watchlist /compare /disclosures /stock/005930` 모두 200·에러 마커 0. 빈상태/배지는 client+localStorage·fetch 게이트라 서버 HTML엔 없어 빌드 청크에서 신규 문자열 존재 확인(watchlist·stock·compare 청크).
- 위험/한계: 빈 상태·소스 배지·다크 가독성은 client 렌더라 헤드리스 브라우저 없이 픽셀 확인 불가(빌드 청크 문자열·클래스 존재로 검증). StockDisclosures는 여전히 구식 `gray-*` 팔레트(나머지는 `zinc-*`) — 이번엔 범위 한정 위해 미통일.
- 다음 패스 제안(1개): StockDisclosures 전체 `gray-*`→`zinc-*` 팔레트 통일 + 공시 카드 DART 본문 핵심 숫자(취득/처분 수량·금액) 추출 노출.

## 2026-06-21 · AI Dev Center Pass 2 UI 명료화 (Task 14, Claude)
- 목표: P0 패스 이후 실사용 명료화. 기존 작업분(미커밋 3파일) 보존하며 점검·소폭 보강 후 검증·커밋.
- 종목탐색(StocksExplorer): ① 질문형 프리셋(자연어 클릭) — "싸고 거래 늘었나/돈 잘 버는 회사/배당 주는 우량주/대형주 안정형/숨은 소형 저평가" 5종, ② 적용 중 필터를 사람이 읽는 칩으로 노출(칩별 × = 해당 필터만 해제) + 전체 초기화, ③ 헤더에 "조건 충족 N개 / 전체 M개" 가시 카운트.
- 오늘(today): ① "후보를 볼 때 체크리스트" 섹션 신설(원문 확인·고점추격 위험·저평가 이유·점수는 우선순위일 뿐·분산은 스스로 — 비자문 고지 포함), ② 후보 카드별 한 줄 💡 이유 유지(종합/저평가/추세 각 reason 함수).
- 공시(DisclosureExplorer): 카드에 유형 자동분류·종목 식별·제출인(flr_nm)·핵심 note 노출 + 원문 보기 / 종목 상세 / 관심(분석 대상 종목 한정 낙관적 토글) 액션. 분석 대상 외 종목은 DART 원문만 안내.
- 카피는 학습용·비자문 유지(매수/매도/추천 신규 유입 없음).
- 검증: `python scripts/verify_metrics.py` 통과(138종목 오류 0 · 브랜드/금칙어 0) / `npm run build` 성공(전 라우트 프리렌더) / 로컬 프로덕션 서버(127.0.0.1:3000, 시작 PID만 종료, 4310 AI Dev Center 무중단)에서 `/ /stocks /today /disclosures /stock/005930` 모두 200·에러 마커 0·UI 마커(질문형 프리셋·체크리스트·💡·원문 보기·제출·관심·조건충족 카운트) 렌더 확인.
- 다음 패스 제안: /stocks 모바일 바텀시트 필터 칩 동기화, 비교 모바일 카드 패턴, 공시 카드 DART 본문 핵심 숫자 추출(취득/처분 수량·금액), 종목상세 결론-위험-근거 재배치.

## 2026-06-20 · AI Dev Center P0 브리프 검증 패스 (Claude)
- 워크트리의 진행분(브랜드 오른스코어 전환 + P0 작업)을 되돌리지 않고 그대로 보존하며 점검.
- P0-1 데이터 일관성: 헤더·푸터·홈·오늘·유니버스·종목상세·상태 모두 `dataMetadata`+`formatBizDate*`/`isDataStale` 단일 출처 사용 확인. 하드코딩 날짜·산식버전 없음(종목상세 주가 기준일만 종목별 가격시계열에서 도출 — 정상).
- P0-2 빈 상태: 관심종목("아직 관심 종목이 없습니다"+가치설명+3 CTA+검색+try/finally 8초 타임아웃), 비교("비교할 종목을 선택하세요"+최대 4개 명시+오늘 Top5/직접 검색/같은 업종 3진입) 소스 검증 완료 — 수정 필요한 갭 없음.
- P0-3/홈 히어로: "10개 이하로 줄이세요"+기준일 pill+"오늘 후보 5개 보기"/"내 조건으로 찾기"+Top5 미리보기+왜 오른스코어 3카드+가치 뒤 안전문구. 렌더 HTML에서 카피 노출 확인. 매수/매도/추천 문구 신규 유입 없음.
- 브랜드 잔재: 사용자 노출 "밸류맵/ValueMap" 0건(렌더 HTML). 잔존 `valuemap_*` localStorage 키·`valuemap:compare-updated` 이벤트명·guide/metrics GitHub URL은 마이그레이션/기능 유지 위해 의도적 보존.
- 빌드 게이트: `npm run build` 성공(전 라우트 프리렌더 OK).
- 브라우저/라우트 스모크: 프로덕션 서버(127.0.0.1:3000)에서 `/ /today /stocks /stock/005930 /watchlist /compare /disclosures /backtest /universe /status` 모두 200, 에러 마커 0, 클라이언트 컴포넌트 경계(관심·비교) SSR 정상.
- 미완/위험: 빈 상태는 client+localStorage 게이트라 헤드리스 브라우저 없이는 서버 HTML로 직접 확인 불가(소스로 검증함). P0-1은 단일 원자적 JSON 스냅샷 전제(배포당 일관) — 풀 DB는 별도 결정 필요.
- 다음 자동화 패스 제안: `/today` 카드별 한 줄 이유 추가 노출, `/stocks` 모바일 바텀시트 필터, 비교 모바일 카드 패턴(가로 테이블 의존 축소), 공시 카드 핵심값 추출.

## 2026-06-19 · AI Dev Center P0 브리프 1차 패스
- AI 센터 큐에 있던 `OrnScore PDF brief P0 automation pass` 기준으로 현재 작업분을 이어 점검.
- 데이터 기준일/산식 버전 공용 헬퍼(`realStocks.ts`) 사용 범위를 확인하고, 헤더·푸터·홈·오늘·유니버스·상태·종목상세의 기준 표기를 동일 출처로 정리된 상태로 검증.
- 관심종목 빈 상태: "아직 관심 종목이 없습니다" 문구, 점수 변화·공시 신호 가치 설명, 종목 탐색/오늘 후보/로그인 동기화 CTA 확인.
- 비교 빈 상태: "비교할 종목을 선택하세요" 문구, 오늘 Top 5/직접 검색/업종 탐색 진입 확인.
- 홈: 히어로를 "오늘 볼 후보를 10개 이하로 줄이세요" 방향으로 보강하고, 왜 오른스코어인가를 `종목 압축`·`산식 공개`·`공시 연결` 3카드로 정리.
- 빌드 검증: `npm run build` 성공.
- 브라우저 확인: `http://127.0.0.1:3000` 홈, `/watchlist`, `/compare`, `/stock/005930`에서 런타임 에러·콘솔 에러 없음 확인. HTTP 스모크는 `/`, `/today`, `/stocks`, `/stock/005930`, `/watchlist`, `/compare`, `/disclosures`, `/backtest` 모두 200.
- 남은 다음 패스: `/today` 카드별 한 줄 이유 강화, `/stocks` 모바일 필터 UX, 비교 모바일 테이블 의존 축소, 공시 카드 핵심값 추출.


## 🆕 라이브 리뷰(2026-06) P0/P1 — 실사용 발견 버그
- ✅ P0-02 공시카드 404 — 홈·오늘 공시카드가 분석대상外 종목도 /stock/로 연결 → DART 원문(외부)+배지로 분기
- ✅ P0-03 수익률 불일치 — 홈/오늘 r3m(FDR)≠차트(prices/json). compute_metrics가 prices/json 읽게 통일(최근253일) → r3m=차트 일치 + r1y 복구. **다음 Run에서 데이터 반영**
- ⬜ P0-01 www.ornscore.com 502 — Vercel에 www 도메인 추가 + apex 리다이렉트(너)
- ⬜ P0-04 알림 출시상태 페이지마다 다름 — feature flag 중앙화
- ✅ P1-02 산식버전 — metricsVersion "phase2-v2"→"2.4" 단일화 + 푸터/상세/universe/status 모두 dataMetadata.metricsVersion 읽음 (next Run 반영)
- ✅ P1-04 업종 분모 — "17개(본인 제외)"·"18곳(본인 포함)" 명시
- ✅ P1-06 V로고 — 헤더·모바일·이메일 전부 O로 + "오른스코어 스톡" 부제 제거
- ✅ P1-07 데이터상태 — 푸터 정적 "정상" → 가격 기준일 신선도 기반(5일+ 지연표시) + /status 링크
- ✅ P0-01 www 502 — Vercel www.ornscore.com 추가 + 308→apex (SSL 생성 중, 너 완료)
- ✅ P0-04 알림 상태 — lib/features.ts 중앙 config + 로그인 "출시예정"→"무료 이용가능"(공시알림 라이브) + 요금제 FREE에 공시알림 추가·PRO는 고급알림 구분
- ✅ P1-01 DART 문구 — "DART API 한도" → "오른스코어 내부 200건 분석 제한"으로 정확화
- ✅ P1-03 동점 순위 — 같은 점수면 "공동 N위" 표시(today 종합 Top)
- ✅ P1-05 빈상태 — 관심종목 무한로딩 차단(try/finally+8초 타임아웃)+에러상태+다시시도. 비교는 빈상태 degrade
- ✅ ORN-011 백테스트 위험 — "수익↑이지만 낙폭↑·위험조정↓" 요약 경고문 추가(벤치 대비 패턴 감지)
- ✅ §4.4 차트 안내 — "길게 터치" → "마우스 올리거나 길게 터치"(PC+모바일)
- ✅ §4.3 종목탐색 — 기본필터/제외 N개 안내 이미 존재
- ⬜ 남은 §4(대규모/데이터): 종목탐색 목록 SSR, 공시 핵심숫자 추출(DART본문), 홈 히어로 간소화, 종목상세 결론-위험-근거 재배치, AI기록 버전, 백테스트 재현설정 다운로드


## 🎨 디자인 설계서 P0 대조 (2026-06)
- ✅ 1 브랜드·로고 통일 (트렌드 O 마크 + 오른스코어)
- ✅ 2 산식버전 통일 (metricsVersion 2.4 단일)
- ✅ 4 데이터상태 칩/페이지 (/status + 푸터 신선도)
- ✅ 6 로그인·약관 사이드바 제거 (Sidebar+MobileBottomNav 경로 hide)
- ✅ 7 관심·비교 빈상태 개선 / ✅ 9 관심종목 무한로딩→에러상태
- ✅ 10 점수 색상 분리 (emerald/blue → 브랜드 인디고+중립, 상승빨강/하락파랑과 구분)
- 🟡 3 상단날짜 중복 / 5 반복고지 축소 / 7 history 빈상태 / 8 모바일 가로넘침 QA / 9 기타 스켈레톤 — 일부 잔여
- ⬜ P1/P2: 페이지 전면 재구성(메인·오늘·탐색·상세·공시), 레이아웃 분리(마케팅/앱/문서/인증), 모바일 바텀시트 — **대규모, 실제 화면 보며 페이지별 반복 필요**

마지막 업데이트: 2026-06-15 (세션: 금지문구·게이트·문자등급제거·신뢰도% + 로드맵)

---

## ✅ 완료 (배포됨 또는 푸시 대기)
- 6.3 거래일 표준 21/63/126/252 — compute_metrics(데이터단)
- 8.4/8.5 위험조정 **백분위화**(선형→백분위) — compute_metrics v2.4
- 8.7 결측 50점 제거(밸류 재가중 + valueNA) — compute_metrics
- 8.9 반올림: composite 원점수 + 화면 Math.round, 80임계값 원점수(compositeOf) 사용 — 모순 없음
- 9.1 문자등급 A+/A/B+ **완전 제거** → 점수 중심 + 상태어(최우선 확인/우선 확인/추가 관찰/일반/조건 낮음) — grade.ts + 종목상세
- 9.4 금지문구 제거(안정적으로 우상향·매수 기회 등) — guide/metrics
- 18.1 공시 "신뢰도 %" → "유형 자동분류"(today 카드·이메일)
- 23.1 라이선스 충돌 해소(오픈소스 표현 제거 + LICENSE 파일 + 약관 명확화)
- 16.1 관심종목 빈 상태 가치 문구
- 13.3 점수 변동 원인(지표별 +/-) — getMetricChangesBatch + today 급변칩 hover 원인
- 16.2 관심종목 전일대비 점수 델타(▲/▼) — watchlist 페이지 델타 fetch + 표시
- 5.3 분석 대상 공개 페이지(/universe) — 138종목 목록·선정기준·데이터기준일·한계 + about 링크
- 7(부분) PER '최근 실적(후행)' 명시 + 기준 안내 — 종목상세 재무탭
- 24 운영 상태 페이지(/status) — 스냅샷 신선도·데이터 소스 상태 + about/universe 링크
- 46 브리핑 Supabase 영속화 — daily-insight cron→daily_insights 테이블 upsert + getLatestStoredInsight + today 브리핑에 AI 요약 표시 (SQL: docs/sql/daily_insights.sql, 너가 실행)
- 9.3 급등 경고 '최근 63거래일(약 3개월)' 거래일 표기
- 11.1 "값 검증 완료" → "이상값 점검 통과"
- 15.3 위험 상세 패널(연환산변동성·최대낙폭·최악의하루·관측일수)
- 15.5 데이터 기준 박스(주가기준일·점수계산·산식버전·분석대상)
- 17.2 비교 공유 URL(/compare?stocks=) + 공유버튼
- 19.1 백테스트 시간순서 / 19.5 벤치마크 명칭 — 이미 준수
- 21 브랜드 오른스코어 통일 + 오타(오른스코어은→는)
- 21.3/26.4 빌드 금칙어 게이트(verify_metrics, 18개 문자열)
- 22 메타: 테마주 문구 제거
- 20.2 PLAN_LIMITS 단일소스(limits.ts)
- [보너스] 현재가 지연시세 라이브(네이버) / 24시간 데이터 자동화(GitHub Actions) / notify 라이브 DART

## 🟡 다음 (코드로 가능 · tsc 환경/awake 권장)
- 22.2 전 페이지 title "X | 오른스코어" 형식 통일 점검
- 11.2 데이터 품질 상태 패널 세분화(가격/재무/공시/경보/교차검증)

## 🟠 진행 중 (인프라 완성, 데이터 검증 대기)
- §10 KRX 시장경보 — **인프라 완성**(marketAlert.ts·market-alerts.json·fetch_market_alerts.py·Action). **데이터 소스 조사 결과(직접 확인)**: ① KRX 데이터포털 시장경보 화면=로그인 필요(무료 자동수집 불가) ② KRX 공식 Open API=시장경보 미제공(가격·기본정보 8종만). **→ 무료 공식 소스 없음.** 남은 옵션: 네이버 per-종목 스크래핑(불안정·샌드박스 테스트 불가, Action 반복검증 필요) 또는 유료. **현재 보류** — 인프라는 받을 준비 완료, 소스 확보 시 fetch_market_alerts만 교체하면 즉시 작동.

## 🔴 차단 (데이터소스·계정·아키텍처 결정 필요 — 단독 불가)
- 4 단일 스냅샷 **DB** 도입 — 현재 정적 JSON은 배포당 원자적이라 페이지불일치 이미 없음. 풀 DB는 과할 수 있음 → **결정 필요**
- 5 유니버스 **관리 테이블**(편입/제외 이력) — 데이터·정책 필요 (※ 공개 목록 페이지 /universe는 5.3 완료)
- 6.2 기업행위(수정주가) — corporate action 데이터 소스 필요(FDR adjustedClose 확인)
- 7 재무 **기준일·Forward PER·교차검증** — DART 재무/컨센서스 **데이터 소스** 필요(ORN-003). ※ PER 라벨/기준안내(표시단)는 부분 완료
- 18.2 공시 핵심 숫자 추출 — DART 본문 파싱 파이프라인
- 19.6 백테스트 시점별 유니버스·OOS·비용민감도 — 백테스트 엔진 확장 + 데이터
- 23.2 개인정보 국외이전 표 — 법무 콘텐츠(사용자 결정)
- 23.3 도메인 이메일(support@/privacy@/data@) — 메일 계정 생성(사용자)
- 24 운영 모니터링 — 공개 상태페이지(/status) 완료. ※ 배치 실패 알림·관리자 전용 상세는 추가 구축 필요
- 26.5/27 E2E·모바일 QA / 28 접근성 / 29 성능 — 실행환경·감사 작업

## 📌 운영자(송) 직접 작업
- Resend ornscore.com 도메인 Verify 확인(대기중)
- Supabase Auth Redirect URLs / Kakao Redirect URI에 ornscore.com 추가
- 위 🔴 항목들의 데이터소스/결정 제공

## 2026-06-16 · 페이지 디자인 재구성 (모바일 우선)
- 메인(page.tsx): 컴팩트 히어로 + '오늘의 데이터' 블록(통계3칸+Top5) 신설, /today와 역할 분리.
- 종목탐색(StocksExplorer): 프리셋·저장조건을 모바일 접이식 '빠른 탐색·저장된 조건'으로 묶어 검색·리스트 상단 배치(데스크탑 lg는 기존대로). 기능 무변경.
- 공시(DisclosureExplorer): 다크모드 버그 수정(카드 bg-white→dark, 기간·필터버튼·SIGNAL_STYLES 다크 변형).
- 오늘(today): 다크모드 버그 수정(통계3칸·SIGNAL_TONE·하단 공시 섹션).
- 종목상세: 이미 다크·모바일 완비 확인 → 무변경.
- 검증: 4파일 파싱 0에러 / 금칙어·한글깨짐 없음. 푸시 대상: page.tsx, StocksExplorer.tsx, DisclosureExplorer.tsx, today/page.tsx.

## 2026-06-16 (2) · 다크모드 전수 감사·수정
- 레포 전체 라이트전용 컬러배경(bg-*-50/from-*-50 dark: 누락) 스캔 → 전부 수정.
- guide/metrics: dark: 0개였음 → 페이지 전면 다크 적용(26곳).
- StockDisclosures·WatchlistClient: 신호색 맵 다크 변형.
- HistoryClient: 호재/리스크 패널 다크. DisclosureExplorer: 에러패널 다크.
- NotificationToggle: 토글 두 상태 다크. StocksExplorer: 카드 인사이트칩 5종 다크.
- 검증: 7파일 파싱 0에러 / 금칙어·한글깨짐 없음 / 최종 재스캔 잔여 0.

## 2026-06-16 (3) · 데이터 검증 + 모바일 QA
- 모멘텀 포화: live 데이터 max=99.3(포화 0개) → 이미 백분위 적용됨. 문제 없음, 재생성 안 함.
- ⚠ 운영 발견: compute_metrics.py=v2.4인데 live metricsVersion=phase2-v2. 데일리 Action이 v2.4를 아직 안 돌림(=v2.4 미push 추정). push 후 Action 돌면 푸터 "Metrics 2.4"로 정리됨.
- 모바일 320px 가로넘침 전수 스캔: 실위험 1건(theme/[slug] 6컬럼 테이블 래퍼 없음) → 가로스크롤 래퍼+min-w 추가.
- theme/[slug]: dark:0(완전 라이트)였음 → 다크모드 전면 + 레이더 SVG currentColor화 + breadcrumb 데드링크 /themes→/stocks.
- 참고: ThemeCard.tsx는 미사용(데드코드), /themes 페이지 없음 — 테마 클러스터 vestigial.

## 2026-06-16 (4) · 라우팅 감사 + /pricing 연결
- 내부 링크·라우팅 전수 감사: 404 데드링크 0건(정적·programmatic 모두). /themes는 이전 수정으로 해소.
- 고아 페이지 발견: /pricing(링크0), /blog·/blog/[slug](링크0). /blog는 WIP로 보류.
- /pricing: 전역 푸터(layout.tsx)에 '요금' 링크 조용히 추가 — 전 페이지 하단 노출.
- node_modules: .gitignore에 정상 포함 확인.


## 2026-06-24 · Pass 11 · 공시 explorer 수집 기준 신선도 라벨 (Task 33, Claude)
- What changed: 공시 신호 페이지(/disclosures)에 '수집 기준 · {KST 시각} · {출처}' 신선도 라벨 추가. 사용자가 보고 있는 공시 묶음이 언제·어디서(실시간/저장본/예시 표본) 수집됐는지 1줄로 표기.
  - `src/app/api/disclosures/recent/route.ts`: live payload에 `fetchedAt`(ISO) 추가, sample 분기에도 `fetchedAt` 추가. cache 분기는 저장된 payload의 fetchedAt를 그대로 carry(원수집 시각 보존). detectSignals·enrich 래퍼·점수·신호강도 무변경(순수 additive).
  - `src/lib/recentSignals.ts`(SSR twin): live·sample 반환에 `source`/`fetchedAt` 추가 → 초기 SSR 렌더에서도 라벨 즉시 노출.
  - `src/components/DisclosureExplorer.tsx`: `ApiResponse`에 `source?`/`fetchedAt?` 추가, `sourceKo`(StockDisclosures SourceBadge와 동일 매핑: 실시간/저장본/예시 표본)·`fmtKST`(명시 timeZone=Asia/Seoul, SSR/CSR 일관) 헬퍼, 헤더 count 줄 아래 `text-[11px] text-zinc-500` muted 라벨. 필드 없으면 graceful(둘 다 없으면 미출력, 시각만 없으면 '수집 시각 미상'). 라이트+다크 동일.
- What passed: `verify_metrics.py`(138종목 0오류·브랜드/금칙어 0, exit 0) · `npm run build`(타입게이트 통과·138p 프리렌더, exit 0, 신선도 라벨 문자열이 `app/disclosures/page` 클라이언트 청크에 컴파일됨) · 로컬 prod(127.0.0.1:3100, 내 PID만 종료, 4310 무중단) `/ /today /stocks /disclosures /stock/005930` 200·에러 0, `/disclosures` SSR HTML에 `수집 기준 · 2026. 06. 24. 00:07 · 예시 표본`(UTC 15:07→KST 정확 변환) 렌더, `/api/disclosures/recent` 200·error null·source=sample·fetchedAt 존재.
- Operator-only blocker(변동 없음): DART 키 필요 fetch 스크립트(`fetch_*_details.py` → `public/data/*-signals.json`)는 로컬 미실행. single_contract/correction의 `⚠️ operator-verify` 정규식(`RE_AMOUNT`/`RE_RATIO`/`RE_BEFORE`/`RE_AFTER`/`RE_FIELD`)은 실보고서 본문 대조 필요.
- Next two local tasks: (a) 동일 신선도 라벨을 종목별 `StockDisclosures` 헤더에도 적용 — `[ticker]` 라우트의 `fetchedAt`를 payload에 추가하고 컴포넌트 헤더에 동일 muted 라벨. (b) Pass 10 잔여 후보: `signalDetailsShared.ts`의 `toEok`/`matchRow` 단위 assertion 추가 또는 6개 lib의 `*Clause()` ` · `-join 빌더 공통화.

## 2026-06-24 · Repair · GlobalSearch hydration warning 제거 (Task 33 gate fix, Claude)
- Blocker: Playwright DESKTOP 품질게이트가 React hydration 경고로 실패 — "Extra attributes from the server: style" at input(GlobalSearch). AppHeader(Server)→GlobalSearch(client)의 검색 input이 SSR HTML과 클라 vdom 사이 style 속성 불일치(검색 input은 브라우저/확장 후처리로 hydration 전 속성이 주입되는 대표 케이스).
- What changed: `src/components/GlobalSearch.tsx` 검색 input에 `suppressHydrationWarning` 추가(Next.js 권장 처리). 순수 additive 1줄, 로직/스타일 무변경. 동일 컴포넌트를 재사용하는 MobileSearchButton 인스턴스도 동시 커버.
- What passed: `npx tsc --noEmit` exit 0(타입게이트 통과). lint는 ESLint 미구성(대화형 셋업)이라 tsc를 확립된 finite check로 사용.
- What remains: 게이트 재실행으로 Playwright DESKTOP 경고 소거 확인. Pass 11의 next-task(StockDisclosures 신선도 라벨, signalDetailsShared 단위 assertion)는 그대로 유효.
- Next two local tasks: (a) `[ticker]` route payload에 fetchedAt 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) GlobalSearch SSR/CSR 속성 일치 회귀 방지용 input 속성 스냅샷 메모를 docs에 남기기.


## Repair — Playwright 게이트 404(정적 청크) 수정: dev/prod distDir 분리 (2026-06-24, Claude)
- Blocker: Task 33 Playwright DESKTOP+MOBILE 게이트가 `_next/static/css/app/layout.css`·`chunks/main-app.js`·`app/layout.js`·`app/not-found.js`·`app-pages-internals.js` 404/ERR_ABORTED로 실패.
- Root cause: `npm run build`(prod, 타입게이트)와 게이트의 `next dev` 가 같은 `.next` 를 공유 → 손상. dev HTML은 unhashed 청크 경로를 참조하나 디스크엔 prod-hashed 산출물만 존재해 404. 실행 중 dev 서버에서 6개 중 5개 자산 404 재현.
- Fix: `next.config.mjs` phase 함수화 — dev(`PHASE_DEVELOPMENT_SERVER`)만 `distDir='.next-dev'`. prod는 기본 `.next`(Vercel 무영향), URL 불변. `.gitignore`에 `.next-dev/`.
- Passed: 재기동 dev에서 이전 404 자산 6종 전부 200 + 게이트 5라우트 200·자산 404 0건 · phase별 distDir 확인(dev=.next-dev/prod=undefined) · `tsc --noEmit` exit 0 · `verify_metrics.py`(PYTHONUTF8=1) 138종목 0오류·금칙어 0 exit 0.
- Next two local tasks: (a) `[ticker]` route payload에 fetchedAt 추가 + StockDisclosures 헤더 신선도 라벨(Pass 11 carry). (b) `signalDetailsShared.ts` `toEok`/`matchRow` 단위 assertion 추가.
