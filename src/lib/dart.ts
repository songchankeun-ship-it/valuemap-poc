// DART OpenAPI 클라이언트 — 공시 데이터 수집
// 문서: https://opendart.fss.or.kr/guide/main.do
//
// PoC 단계 메서드:
//   - listDisclosures()  : 기간별 공시 목록
//   - getCorpCode()      : 종목코드 ↔ DART 고유코드 매핑 (전체 zip 다운로드, 캐시 권장)
//   - getCompanyOverview(): 기업 개황
//
// 운영 단계 추가 메서드 (TODO):
//   - getFinancialStatements (정기보고서 재무제표)
//   - getMajorAcquisitionsAndDispositions
//   - getInsiderTransactions

import { z } from "zod";
import { stockToCorp } from "./corp-codes";

const DART_BASE = "https://opendart.fss.or.kr/api";

const DisclosureSchema = z.object({
  corp_name: z.string(),
  corp_code: z.string(),
  stock_code: z.string().optional().default(""),
  corp_cls: z.string(),
  report_nm: z.string(),
  rcept_no: z.string(),
  flr_nm: z.string(),
  rcept_dt: z.string(),
  rm: z.string().optional().default(""),
});

const DisclosureListSchema = z.object({
  status: z.string(),
  message: z.string(),
  page_no: z.number().optional(),
  page_count: z.number().optional(),
  total_count: z.number().optional(),
  total_page: z.number().optional(),
  list: z.array(DisclosureSchema).optional().default([]),
});

export type Disclosure = z.infer<typeof DisclosureSchema>;

export interface ListDisclosuresParams {
  /** YYYYMMDD */
  bgnDe?: string;
  endDe?: string;
  /** 종목코드 6자리 (선택) */
  corpCode?: string;
  /** Y(유가), K(코스닥), N(코넥스), E(기타) */
  corpCls?: "Y" | "K" | "N" | "E";
  pageNo?: number;
  pageCount?: number;
}

function getApiKey(): string {
  const key = process.env.DART_API_KEY;
  if (!key) {
    throw new Error("DART_API_KEY가 설정되지 않았습니다. .env에 추가하세요.");
  }
  return key;
}

/**
 * 공시 검색
 * 예: listDisclosures({ bgnDe: "20260520", endDe: "20260528" })
 */
export async function listDisclosures(
  params: ListDisclosuresParams = {}
): Promise<{ items: Disclosure[]; totalCount: number; totalPage: number }> {
  const search = new URLSearchParams({
    crtfc_key: getApiKey(),
    page_no: String(params.pageNo ?? 1),
    page_count: String(params.pageCount ?? 100),
  });
  if (params.bgnDe) search.set("bgn_de", params.bgnDe);
  if (params.endDe) search.set("end_de", params.endDe);
  if (params.corpCode) search.set("corp_code", params.corpCode);
  if (params.corpCls) search.set("corp_cls", params.corpCls);

  const res = await fetch(`${DART_BASE}/list.json?${search}`, {
    next: { revalidate: 60 * 30 }, // 30분 캐시
  });
  if (!res.ok) throw new Error(`DART API ${res.status}`);

  const json = await res.json();
  const parsed = DisclosureListSchema.parse(json);

  if (parsed.status !== "000") {
    // 000 = 정상. 013 = 조회된 데이터 없음 (정상 처리)
    if (parsed.status === "013") {
      return { items: [], totalCount: 0, totalPage: 0 };
    }
    throw new Error(`DART error ${parsed.status}: ${parsed.message}`);
  }
  return {
    items: parsed.list,
    totalCount: parsed.total_count ?? 0,
    totalPage: parsed.total_page ?? 0,
  };
}

/**
 * 기업 개황
 */
export async function getCompanyOverview(corpCode: string) {
  const search = new URLSearchParams({
    crtfc_key: getApiKey(),
    corp_code: corpCode,
  });
  const res = await fetch(`${DART_BASE}/company.json?${search}`, {
    next: { revalidate: 60 * 60 * 24 }, // 24시간 캐시
  });
  if (!res.ok) throw new Error(`DART API ${res.status}`);
  return await res.json();
}

/**
 * 공시 원문 뷰어 URL
 */
export function disclosureViewerUrl(rceptNo: string): string {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
}

/**
 * 종목코드(6자리) 기준 최근 N일 공시 조회.
 * 내부에서 corp_code 매핑 후 listDisclosures 호출.
 *
 * @param stockCode 종목코드 6자리 (예: "005930")
 * @param days      조회 기간 (영업일 아닌 달력일). 기본 90일
 * @param limit     최대 반환 개수. 기본 20, 최대 100
 * @returns         Disclosure[] (매핑 실패 시 빈 배열)
 */
export async function listDisclosuresByStock(
  stockCode: string,
  days: number = 90,
  limit: number = 20
): Promise<Disclosure[]> {
  // ticker(6자리) → corp_code(8자리)
  const corpCode = await stockToCorp(stockCode);
  if (!corpCode) {
    // 비상장사 또는 매핑 없음 → 빈 배열 (route 측에서 샘플 폴백)
    return [];
  }

  // days → YYYYMMDD 범위
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const endDe = formatYMD(now);
  const bgnDe = formatYMD(past);

  const { items } = await listDisclosures({
    corpCode,
    bgnDe,
    endDe,
    pageCount: Math.min(100, Math.max(limit, 20)),
  });

  // 최신순 정렬 + limit 적용
  const sorted = [...items].sort((a, b) =>
    b.rcept_dt.localeCompare(a.rcept_dt)
  );
  return sorted.slice(0, limit);
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
