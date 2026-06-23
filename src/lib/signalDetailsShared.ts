// 공시 enrich 5종(insider/treasury/capital/contract/correction) 공통 유틸.
// 각 enrichX 라이브러리가 공유하던 (1) public/data/*-signals.json graceful 로딩,
// (2) rcept_no 기반 행 매칭, (3) 원→억원 반올림 변환을 한 곳으로 모은다.
// enrichX별 신호 로직(signalType 가드·note 문자열)은 여기에 두지 않는다.
import fs from "fs";
import path from "path";

// 파일명 -> 파싱 결과(또는 null) 캐시. 같은 *-signals.json은 최대 1회만 읽는다.
const fileCache = new Map<string, unknown>();

/**
 * public/data/{filename} 을 한 번만 읽어 종목코드별 행 맵으로 반환한다.
 * 파일이 없거나 파싱 실패면 graceful 하게 빈 객체({})를 돌려준다.
 */
export function loadSignalFile<T>(filename: string): Record<string, T[]> {
  if (fileCache.has(filename)) {
    return (fileCache.get(filename) as Record<string, T[]> | null) ?? {};
  }
  let data: Record<string, T[]> | null = null;
  try {
    const p = path.join(process.cwd(), "public", "data", filename);
    if (fs.existsSync(p)) data = JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    data = null;
  }
  fileCache.set(filename, data);
  return data ?? {};
}

/** rcept_no가 일치하는 행을 찾고, 없으면 첫 행으로 폴백한다(rows가 비어 있으면 undefined). */
export function matchRow<T extends { rcept_no?: string }>(
  rows: T[],
  rceptNo: string | undefined
): T | undefined {
  return rows.find((r) => r.rcept_no === rceptNo) ?? rows[0];
}

/** 원 단위 금액을 억원으로 반올림한다(형제 enrich 공통 단위). */
export function toEok(won: number): number {
  return Math.round(won / 1e8);
}
