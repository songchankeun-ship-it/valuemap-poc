// DART corp_code (8자리) ↔ 종목코드 (6자리) 매핑.
//
// DART는 corp_code 8자리를 사용. 종목코드 6자리(예: 005930)와 다름.
// 전체 매핑 zip(약 1.5MB)을 한 번 다운로드해서 파일 캐시.
// 다음 호출부터 파일에서 즉시 로드 (메모리 캐시도 유지).
//
// 운영 시: 매주 1회 백그라운드 갱신 (신규 상장사 추가됨).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const CACHE_DIR = join(process.cwd(), ".cache");
const CACHE_FILE = join(CACHE_DIR, "corp-codes.json");
const REFRESH_DAYS = 7;

export interface CorpInfo {
  corpCode: string;     // DART 8자리
  corpName: string;
  stockCode: string;    // 6자리
  modifyDate: string;
}

// 메모리 캐시 (프로세스 단위)
let memCache: Map<string, CorpInfo> | null = null;

/**
 * 종목코드(6자리) → DART corpInfo. 비상장사는 매핑 없음.
 * 처음 호출 시 캐시 없으면 자동 다운로드.
 */
export async function getCorpInfo(stockCode: string): Promise<CorpInfo | null> {
  const mapping = await loadMapping();
  return mapping.get(stockCode) ?? null;
}

/** stockCode → corp_code 8자리 (짧은 헬퍼) */
export async function stockToCorp(stockCode: string): Promise<string | null> {
  const info = await getCorpInfo(stockCode);
  return info?.corpCode ?? null;
}

async function loadMapping(): Promise<Map<string, CorpInfo>> {
  if (memCache) return memCache;

  // 파일 캐시 시도
  if (existsSync(CACHE_FILE)) {
    try {
      const raw = await readFile(CACHE_FILE, "utf-8");
      const cached = JSON.parse(raw) as {
        downloadedAt: string;
        entries: CorpInfo[];
      };
      const ageDays = (Date.now() - new Date(cached.downloadedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays < REFRESH_DAYS) {
        memCache = buildMap(cached.entries);
        return memCache;
      }
    } catch {
      // 캐시 파일 손상 — 재다운로드
    }
  }

  // 다운로드
  const entries = await downloadAndParse();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(
    CACHE_FILE,
    JSON.stringify({ downloadedAt: new Date().toISOString(), entries }, null, 0),
    "utf-8"
  );
  memCache = buildMap(entries);
  return memCache;
}

function buildMap(entries: CorpInfo[]): Map<string, CorpInfo> {
  const m = new Map<string, CorpInfo>();
  for (const e of entries) {
    if (e.stockCode) m.set(e.stockCode, e);
  }
  return m;
}

async function downloadAndParse(): Promise<CorpInfo[]> {
  const key = process.env.DART_API_KEY;
  if (!key) {
    throw new Error("DART_API_KEY 미설정. corp_code 다운로드 불가.");
  }
  const url = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`corp_code 다운로드 실패 ${res.status}`);
  }

  // 응답은 zip 파일. Node.js 표준 라이브러리만으론 zip 처리 어려움.
  // → 운영에선 jszip / adm-zip 같은 의존성 추가 권장.
  // 여기선 jszip을 동적 import (있을 때만)
  const arrayBuffer = await res.arrayBuffer();
  let xmlText: string;
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    const fileName = Object.keys(zip.files)[0];
    if (!fileName) throw new Error("zip이 비어 있습니다.");
    xmlText = await zip.files[fileName].async("text");
  } catch (e) {
    throw new Error(
      `corp_code zip 압축 해제 실패. \`pnpm add jszip\` 설치 필요. (${(e as Error).message})`
    );
  }

  return parseXml(xmlText);
}

/** 매우 간단한 XML 파서 — 의존성 없이.
 *  corp_code XML 구조: <result><list><corp_code>...</corp_code><corp_name>...</corp_name>...</list>...</result>
 */
function parseXml(xml: string): CorpInfo[] {
  const out: CorpInfo[] = [];
  const listRe = /<list>([\s\S]*?)<\/list>/g;
  let m: RegExpExecArray | null;
  while ((m = listRe.exec(xml)) !== null) {
    const inner = m[1];
    const get = (tag: string) => {
      const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
      const mm = inner.match(r);
      return mm ? mm[1].trim() : "";
    };
    const stockCode = get("stock_code");
    if (!stockCode) continue; // 비상장사 제외
    out.push({
      corpCode: get("corp_code"),
      corpName: get("corp_name"),
      stockCode,
      modifyDate: get("modify_date"),
    });
  }
  return out;
}
