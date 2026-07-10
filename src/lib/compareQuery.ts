// 비교 페이지 공유 링크(?stocks=...) 파싱 — 순수 함수(의존성 없음)로 분리.
// 서버 컴포넌트(compare/page.tsx)와 단위 테스트(scripts/test_compare_query.ts)가 함께 쓴다.
// 규칙: 6자리 숫자 + 실제 풀 존재만 유효, 중복 제거, 최대 4개까지 반영하고 초과분은 truncated로 분리.
// 표시 정책만 담당하며 수집·점수·데이터 의미는 바꾸지 않는다.

export const COMPARE_QUERY_MAX = 4;

export interface ParsedCompareQuery {
  /** 비교에 반영할 유효 티커(중복 제거, 최대 COMPARE_QUERY_MAX개) */
  initialTickers: string[];
  /** 형식이 틀렸거나 풀에 없는 코드 — 경고로 안내 */
  invalidTickers: string[];
  /** 유효하지만 상한(COMPARE_QUERY_MAX)을 넘겨 잘라낸 티커 — 초과 안내 */
  truncatedTickers: string[];
}

// isValidCode: 6자리 숫자 코드가 실제 비교 풀에 존재하는지 판정(호출측이 stockMap으로 주입).
export function parseCompareQuery(
  raw: string | string[] | undefined,
  isValidCode: (code: string) => boolean
): ParsedCompareQuery {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const initialTickers: string[] = [];
  const invalidTickers: string[] = [];
  const truncatedTickers: string[] = [];
  const seen = new Set<string>();
  if (!value) return { initialTickers, invalidTickers, truncatedTickers };

  for (const part of value.split(",")) {
    const code = part.trim().toUpperCase();
    if (!code) continue;
    if (!/^\d{6}$/.test(code) || !isValidCode(code)) {
      invalidTickers.push(code);
      continue;
    }
    if (seen.has(code)) continue; // 중복 제거 — 앞선 항목만 유지
    seen.add(code);
    if (initialTickers.length < COMPARE_QUERY_MAX) initialTickers.push(code);
    else truncatedTickers.push(code); // 상한 초과분은 잘라내되 안내용으로 보관
  }
  return { initialTickers, invalidTickers, truncatedTickers };
}
