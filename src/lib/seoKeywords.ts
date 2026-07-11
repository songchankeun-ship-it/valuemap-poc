export const brandKeywords = [
  "오른스코어",
  "ORNScore",
  "한국 주식 탐색",
  "주식 분석 도구",
] as const;

export const stockDiscoveryKeywords = [
  "주식 스크리닝",
  "종목 검색",
  "종목 분석",
  "한국 주식 분석",
  "코스피 종목 분석",
  "코스닥 종목 분석",
  "저평가 주식 찾기",
  "배당수익률 높은 주식",
  "PER 낮은 종목",
  "PBR 낮은 종목",
  "ROE 높은 종목",
] as const;

export const metricKeywords = [
  "PER 뜻",
  "PBR 뜻",
  "ROE 뜻",
  "PER PBR ROE 비교",
  "주식 지표 보는 법",
  "주식 점수 산식",
  "밸류에이션 지표",
  "거래활성도 지표",
  "위험조정 수익률",
] as const;

export const disclosureKeywords = [
  "DART 공시 분석",
  "전자공시 분석",
  "자사주 취득 공시",
  "자기주식 취득 결정",
  "주요주주 보유변동",
  "임원 보유변동",
  "정정공시",
  "단일판매 공급계약",
  "전환사채 공시",
  "유상증자 공시",
] as const;

export const trustKeywords = [
  "주식 데이터 기준일",
  "주식 데이터 출처",
  "KRX 데이터",
  "DART 데이터",
  "Naver Finance PER PBR ROE",
] as const;

export const themeSeoAliases: Record<string, readonly string[]> = {
  battery: ["2차전지 관련주", "배터리 관련주", "전기차 배터리 관련주", "2차전지 테마주"],
  "semi-materials": ["반도체 관련주", "반도체 소재 관련주", "HBM 관련주", "반도체 테마주"],
  bio: ["바이오 관련주", "제약 바이오 관련주", "바이오 테마주"],
  shipbuilding: ["조선 관련주", "조선 기자재 관련주", "조선 테마주"],
  robot: ["로봇 관련주", "로봇 테마주", "자동화 관련주"],
};

export function uniqueKeywords(...groups: readonly (readonly string[])[]): string[] {
  return Array.from(new Set(groups.flat()));
}

export function themeKeywords(slug: string, name: string): string[] {
  return uniqueKeywords(
    themeSeoAliases[slug] ?? [],
    [`${name} 관련주`, `${name} 테마주`, `${name} 종목`, `${name} 주식`],
    stockDiscoveryKeywords.slice(0, 4)
  );
}

export function keywordSentence(keywords: readonly string[], max = 6): string {
  return keywords.slice(0, max).join(" · ");
}
