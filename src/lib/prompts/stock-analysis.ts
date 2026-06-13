// AI 종목 분석 프롬프트 — 밸류맵의 핵심 IP
// 설계 원칙:
// 1. 정직: 호재 3 + 리스크 3 균형 강제. "보장"·"추천" 단어 금지.
// 2. 데이터 기반: 자체 지표 4종 + 재무 + 공시 모든 출처를 본문에 인용.
// 3. 짧음: 1,000~1,500자 (긴 글은 안 읽음). 8섹션 고정.
// 4. 톤: 분석가 톤. 주달의 "쉽다"·"보장" 톤과 정반대.

export interface StockAnalysisInput {
  ticker: string;
  name: string;
  marketCap: number;          // 원
  currentPrice: number;       // 원
  changePct: number;          // 일간 %
  per: number | null;
  pbr: number | null;
  roe: number | null;
  dividendYield: number | null;

  // 자체 지표 4종 (0~100)
  momentumScore: number;
  flowScore: number;
  valueScore: number;
  volAdjustedScore: number;
  compositeScore: number;
  neglectScore: number;

  // peer 평균
  peerPerAvg: number;
  peerPbrAvg: number;

  // 소속 테마
  themes: string[];

  // 수급 (최근 5일)
  foreignNetSum: number;      // 원
  pensionNetSum: number;

  // 최근 공시 (최대 5건)
  recentDisclosures: Array<{
    reportNm: string;
    submittedAt: string;
  }>;

  // 가격 추세
  return1m: number;
  return3m: number;
  return6m: number;
  return1y: number;
}

export interface StockAnalysisOutput {
  oneLineSummary: string;
  scoreInterpretation: string;
  financialContext: string;
  themeContext: string;
  disclosureInsight: string;
  positives: string[];          // 정확히 3개
  risks: string[];              // 정확히 3개
  finalScore: number;           // 0~100
  finalNote: string;
}

// ---------- 시스템 프롬프트 ----------

export const SYSTEM_PROMPT = `당신은 밸류맵(ValueMap)의 한국 주식 분석가입니다.

**핵심 원칙 (절대 위반 금지)**:
1. 정직: "보장", "확실", "쉽다", "무조건" 같은 단어 금지.
2. 균형: 호재만 또는 리스크만 강조하지 않고 둘을 동등하게 다룹니다.
3. 데이터 기반: 모든 주장 옆에 출처(자체 지표/재무/공시 등)를 명시합니다.
4. 행동 권유 금지: "매수하세요", "팔아라" 같은 직접 권유 대신 "관찰", "검토", "주목"을 씁니다.
5. 압축: 한 섹션은 최대 3문장. 짧고 정확하게.

**톤**:
- 분석가의 차분한 톤. 흥분/과장/세일즈 금지.
- 한국어. 영어 약어(PER, ROE 등)는 그대로.
- 어미는 "~로 보입니다", "~인 점이 주목됩니다", "~를 검토할 만합니다" 등 관찰적.

**자체 지표 4종 해석 가이드**:
- 모멘텀(0~100): 80+ 강한 상승 추세 / 50 중립 / 20- 약세 추세
- 거래활성도(0~100): 80+ 강한 매집 / 20- 매도 출회
- 밸류(0~100): 80+ 동일 테마 대비 저평가 / 20- 고평가
- 변동성조정(0~100): 80+ 위험 대비 좋은 수익 / 20- 변동성 큰 손실
- 종합점수: 4종 가중평균. 70+이면 검토 구간.

**출력 형식**:
다음 JSON 형식으로만 응답하세요. 마크다운/설명/머리말 없이 JSON 객체 그 자체만:

{
  "oneLineSummary": "한 줄 요약 (50자 이내)",
  "scoreInterpretation": "자체 지표 4종 종합 해석 (2~3문장)",
  "financialContext": "PER/PBR/ROE 핵심 (2~3문장)",
  "themeContext": "소속 테마 맥락 (2~3문장)",
  "disclosureInsight": "최근 공시 시사점 (1~2문장, 공시 없으면 빈 문자열)",
  "positives": ["호재1 (한 문장)", "호재2", "호재3"],
  "risks": ["리스크1", "리스크2", "리스크3"],
  "finalScore": 종합점수_0_to_100_정수,
  "finalNote": "마지막 한 줄 — 관찰만, 행동 권유 금지"
}`;

// ---------- 사용자 메시지 빌더 ----------

export function buildUserMessage(input: StockAnalysisInput): string {
  const formatKRW = (n: number) => {
    if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조원`;
    if (n >= 1e8) return `${(n / 1e8).toFixed(0)}억원`;
    return `${n.toLocaleString()}원`;
  };
  const pctStr = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  const disclosureSummary = input.recentDisclosures.length === 0
    ? "최근 공시 없음"
    : input.recentDisclosures
        .slice(0, 5)
        .map((d) => `- ${d.submittedAt}: ${d.reportNm}`)
        .join("\n");

  return `다음 종목의 분석 리포트를 JSON으로 작성하세요.

**종목**: ${input.name} (${input.ticker})
**현재가**: ${formatKRW(input.currentPrice)} (${pctStr(input.changePct)})
**시가총액**: ${formatKRW(input.marketCap)}

**재무 지표**
- PER: ${input.per?.toFixed(1) ?? "N/A"}x (테마 평균 ${input.peerPerAvg.toFixed(1)}x)
- PBR: ${input.pbr?.toFixed(2) ?? "N/A"}x (테마 평균 ${input.peerPbrAvg.toFixed(2)}x)
- ROE: ${input.roe?.toFixed(1) ?? "N/A"}%
- 배당수익률: ${input.dividendYield?.toFixed(2) ?? "N/A"}%

**자체 지표 4종 (0~100, 높을수록 매력적)**
- 모멘텀: ${input.momentumScore}
- 거래활성도: ${input.flowScore}
- 밸류 (저평가): ${input.valueScore}
- 변동성조정 수익률: ${input.volAdjustedScore}
- 종합 점수: ${input.compositeScore}
- 소외 점수 (참고): ${input.neglectScore}

**기간별 수익률**
- 1개월: ${pctStr(input.return1m)}
- 3개월: ${pctStr(input.return3m)}
- 6개월: ${pctStr(input.return6m)}
- 1년: ${pctStr(input.return1y)}

**수급 (최근 5거래일)**
- 외국인 순매수: ${formatKRW(input.foreignNetSum)}
- 연기금 순매수: ${formatKRW(input.pensionNetSum)}

**소속 테마**: ${input.themes.join(", ")}

**최근 공시 (최대 5건)**
${disclosureSummary}

위 데이터만 사용해서 분석하세요. 외부 지식·추측 금지. JSON만 출력하세요.`;
}

// ---------- 검증 ----------

export function validateOutput(raw: unknown): StockAnalysisOutput {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI 응답이 객체가 아닙니다.");
  }
  const o = raw as Record<string, unknown>;
  const required = [
    "oneLineSummary", "scoreInterpretation", "financialContext",
    "themeContext", "disclosureInsight", "positives", "risks", "finalScore", "finalNote",
  ];
  for (const k of required) {
    if (!(k in o)) throw new Error(`AI 응답에 ${k}이 없습니다.`);
  }
  if (!Array.isArray(o.positives) || o.positives.length !== 3) {
    throw new Error("호재는 정확히 3개여야 합니다.");
  }
  if (!Array.isArray(o.risks) || o.risks.length !== 3) {
    throw new Error("리스크는 정확히 3개여야 합니다.");
  }
  if (typeof o.finalScore !== "number" || o.finalScore < 0 || o.finalScore > 100) {
    throw new Error("finalScore는 0~100 정수여야 합니다.");
  }
  return o as unknown as StockAnalysisOutput;
}
