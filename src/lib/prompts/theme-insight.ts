// 일일 테마 인사이트 프롬프트 — 메인 페이지의 "오늘의 인사이트" 자동 생성
// 매일 상위 5개 테마(또는 핫 테마)에 대해 한 문단 분석 생성.

export interface ThemeInsightInput {
  // 어제 ~ 오늘 흐름 묶음 (5개 테마 한 번에 분석)
  themes: Array<{
    name: string;
    category: string;
    stockCount: number;
    return1d: number;        // 일간 평균 수익률 %
    return5d: number;        // 5일 누적 %
    momentum: number;        // 0~100
    flow: number;
    value: number;
    vol: number;
    composite: number;
    foreignNetSum: number;   // 5일 외국인 순매수 (원)
    pensionNetSum: number;   // 5일 연기금
    topStocks: string[];     // 시총 상위 3개
    recentNews?: string;     // 최근 헤드라인 한 줄 (있으면)
  }>;
  dateKST: string;           // YYYY-MM-DD
}

export interface ThemeInsightOutput {
  headline: string;          // 인사이트 한 줄 제목 (50자 이내)
  summary: string;           // 인사이트 본문 2~4문장
  highlightedThemes: string[]; // 본문에서 강조한 테마 이름들 (2~4개)
  watchPoints: string[];     // 다음 1주일 주목할 포인트 2~3개
  generatedAt: string;       // ISO date
}

export const THEME_INSIGHT_SYSTEM = `당신은 오른스코어(Ornscore)의 시장 인사이트 분석가입니다.

**역할**:
매일 아침 발행되는 "오늘의 인사이트" 단 한 편을 작성합니다. 사용자는 사이트 메인에서 이 인사이트를 30초 안에 읽고 오늘의 시장 흐름을 파악합니다.

**핵심 원칙**:
1. 짧음: 본문 2~4문장. 길면 안 읽힘.
2. 정직: "보장", "확실", "쉽다", "추천" 같은 단어 금지.
3. 행동 권유 금지: "사세요" 대신 "주목", "관찰", "검토" 표현.
4. 데이터 인용: 모든 주장 옆에 출처(자체 지표/거래활성도/수익률) 명시.
5. 패턴 발견: 단순 사실 나열이 아니라 "왜 이 5개가 같이 묶이는가" 같은 통찰.

**좋은 인사이트 예시**:
- "외국인 자금이 3일 연속 유입된 테마 3" — 패턴
- "코스피 약세 속 방어력 보인 4개 테마" — 대비
- "변동성조정 점수 80+ 종목들의 공통점" — 통찰

**나쁜 예시**:
- "오늘 2차전지가 +2% 상승" — 단순 사실
- "지금 사면 좋은 종목" — 권유

**톤**:
- 차분한 분석가.
- 한국어. 어미는 "~로 보입니다", "~가 주목됩니다".

**출력 형식**:
JSON만 출력하세요. 마크다운/설명/머리말 없이:

{
  "headline": "인사이트 제목 (50자 이내, 패턴이 보이는 문장)",
  "summary": "본문 2~4문장. 자체 지표·거래활성도·수익률 등 데이터 인용 필수.",
  "highlightedThemes": ["테마1", "테마2"],
  "watchPoints": ["향후 1주일 주목점1", "주목점2"],
  "generatedAt": "ISO date 자동 생성"
}`;

export function buildThemeInsightMessage(input: ThemeInsightInput): string {
  const formatKRW = (n: number) => {
    if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조원`;
    if (n >= 1e8) return `${(n / 1e8).toFixed(0)}억원`;
    return `${n.toLocaleString()}원`;
  };
  const pctStr = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  const themesBlock = input.themes
    .map((t, i) => {
      const lines = [
        `${i + 1}. ${t.name} (${t.category}, ${t.stockCount}개 종목)`,
        `   - 일간 평균: ${pctStr(t.return1d)} / 5일 누적: ${pctStr(t.return5d)}`,
        `   - 자체 지표: 모멘텀 ${t.momentum} / 거래활성도 ${t.flow} / 밸류 ${t.value} / 변동성조정 ${t.vol} / 종합 ${t.composite}`,
        `   - 5일 수급: 외국인 ${formatKRW(t.foreignNetSum)} / 연기금 ${formatKRW(t.pensionNetSum)}`,
        `   - 시총 상위: ${t.topStocks.join(", ")}`,
      ];
      if (t.recentNews) lines.push(`   - 최근 헤드라인: ${t.recentNews}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return `오늘 날짜: ${input.dateKST}

다음 5개 테마의 데이터를 보고 "오늘의 인사이트" 한 편을 작성하세요.

${themesBlock}

위 데이터에서 패턴·통찰을 찾아 50자 이내 헤드라인 + 2~4문장 본문으로 정리하세요. JSON만 출력합니다.`;
}

export function validateThemeInsightOutput(raw: unknown): ThemeInsightOutput {
  if (!raw || typeof raw !== "object") throw new Error("응답이 객체가 아닙니다.");
  const o = raw as Record<string, unknown>;
  for (const k of ["headline", "summary", "highlightedThemes", "watchPoints"]) {
    if (!(k in o)) throw new Error(`응답에 ${k}이 없습니다.`);
  }
  if (!Array.isArray(o.highlightedThemes) || o.highlightedThemes.length === 0) {
    throw new Error("highlightedThemes는 비어 있을 수 없습니다.");
  }
  if (!Array.isArray(o.watchPoints) || o.watchPoints.length === 0) {
    throw new Error("watchPoints는 비어 있을 수 없습니다.");
  }
  return {
    headline: String(o.headline),
    summary: String(o.summary),
    highlightedThemes: (o.highlightedThemes as string[]).map(String),
    watchPoints: (o.watchPoints as string[]).map(String),
    generatedAt: typeof o.generatedAt === "string" ? o.generatedAt : new Date().toISOString(),
  };
}
