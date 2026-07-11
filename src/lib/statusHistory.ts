/**
 * 데이터 상태 이력(append-only 스냅샷 로그) 스캐폴드 — 단일 소스.
 * 설계 근거: docs/ornscore-data-status-history-and-chart-markers-plan-2026-07-11.md §1.
 *
 * 목적: /status의 "현재 스냅샷 1개"만으로는 일자별 파이프라인 이력을 보여줄 수 없다.
 * 진짜 이력은 매 생성 시점의 스냅샷을 append-only로 쌓아야 의미가 생긴다. 이 파일은
 * 그 로그를 **읽고·검증·병합**하는 순수 계층만 제공한다(가짜 과거 스냅샷을 지어내지 않는다).
 *
 * 정직성 규칙:
 * - 로그 파일(public/data/status-history.json)이 없으면 이력은 빈 배열이다(폴백 = 화면은 안내만 노출).
 * - 로그가 없는 상태에서 "현재 스냅샷 1개"를 이력으로 렌더하지 않는다(1행짜리 가짜 이력 금지).
 * - 파생 진단 수치(검증 보류·결측·가격 지연)는 "지어내지 않음": 수집 단계가 계산해 넘긴 값만 기록하고,
 *   넘기지 않으면 null("미기록")로 둔다.
 *
 * 이 모듈은 fs만 쓰고 realStocks/dataStatus를 import하지 않는다(순수 유지). 덕분에
 * tsx 단위 테스트(scripts/test_statusHistory.ts)가 stocks.json 번들 없이 이 로직을 검증할 수 있다.
 * 라이브 값으로 오늘의 레코드를 만드는 쪽(page.tsx·append 훅)이 buildStatusSnapshotRecord에 값을 주입한다.
 */
import fs from "fs";
import path from "path";

/** append-only 로그의 저장소 상대 경로(문서·훅·리더가 공유하는 단일 상수). */
export const STATUS_HISTORY_REL_PATH = "public/data/status-history.json";

/** 위 경로의 절대 경로(서버·스크립트 공용). */
export const STATUS_HISTORY_ABS_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "status-history.json",
);

/** 로그 상한(표시·보존 모두 이 개수까지만; 오래된 항목은 병합 시 잘림). */
export const MAX_HISTORY_ENTRIES = 60;

/**
 * 일자별 데이터 파이프라인 스냅샷 1건.
 * 필수: generatedAt(ISO)·asOfBusinessDate(YYYYMMDD). 나머지는 미기록이면 null.
 * 진단 수치는 수집 단계가 계산해 넘긴 값만 담는다(런타임 날조 없음).
 */
export interface StatusHistoryEntry {
  /** 점수 생성 시각 ISO(예: "2026-07-10T09:41:59Z"). 스냅샷의 시간축. */
  generatedAt: string;
  /** 가격·점수 기준 영업일 YYYYMMDD. */
  asOfBusinessDate: string;
  /** 가격 동기화 시각 ISO(있으면). */
  pricesSyncedAt: string | null;
  /** 산식 버전(예: "2.4"). */
  metricsVersion: string | null;
  /** 분석 대상 종목 수. */
  universeCount: number | null;
  /** 검증 보류(suspect) 종목 수 — 수집 단계 계산값. 미기록 null. */
  suspectCount: number | null;
  /** PER·PBR 결측 종목 수 — 수집 단계 계산값. 미기록 null. */
  missingFinancialsCount: number | null;
  /** 전역 기준일보다 과거인 종목 수 — 수집 단계 계산값. 미기록 null. */
  priceLagCount: number | null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isYmd(v: unknown): v is string {
  return typeof v === "string" && /^\d{8}$/.test(v);
}

/** number거나 없으면 null로 정규화(NaN·음수·비정수는 null). */
function coerceCount(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
  return Math.floor(v);
}

/** 알 수 없는 값 1건 → 검증된 StatusHistoryEntry. 필수 필드 없으면 null(조용히 버림). */
export function coerceEntry(x: unknown): StatusHistoryEntry | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (!isNonEmptyString(o.generatedAt)) return null;
  if (!isYmd(o.asOfBusinessDate)) return null;
  return {
    generatedAt: o.generatedAt,
    asOfBusinessDate: o.asOfBusinessDate,
    pricesSyncedAt: isNonEmptyString(o.pricesSyncedAt) ? o.pricesSyncedAt : null,
    metricsVersion: isNonEmptyString(o.metricsVersion) ? o.metricsVersion : null,
    universeCount: coerceCount(o.universeCount),
    suspectCount: coerceCount(o.suspectCount),
    missingFinancialsCount: coerceCount(o.missingFinancialsCount),
    priceLagCount: coerceCount(o.priceLagCount),
  };
}

/** 생성 시각 내림차순(최신 먼저). 동시각이면 기준일 내림차순. */
function byGeneratedDesc(a: StatusHistoryEntry, b: StatusHistoryEntry): number {
  if (a.generatedAt !== b.generatedAt) return a.generatedAt < b.generatedAt ? 1 : -1;
  if (a.asOfBusinessDate !== b.asOfBusinessDate) return a.asOfBusinessDate < b.asOfBusinessDate ? 1 : -1;
  return 0;
}

/** JSON 텍스트 → 검증·정렬·상한 적용된 이력 배열(파싱 실패·형식 오류는 빈 배열). 순수. */
export function parseStatusHistory(text: string, cap = MAX_HISTORY_ENTRIES): StatusHistoryEntry[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return [];
  }
  // 최상위는 배열이거나 { entries: [...] } 형태를 허용(향후 메타 확장 여지).
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { entries?: unknown }).entries)
      ? (raw as { entries: unknown[] }).entries
      : null;
  if (!arr) return [];
  const entries = arr.map(coerceEntry).filter((e): e is StatusHistoryEntry => e !== null);
  entries.sort(byGeneratedDesc);
  return entries.slice(0, cap);
}

/**
 * 새 스냅샷을 기존 이력에 append-only로 병합(순수).
 * - 같은 기준일(asOfBusinessDate)이 이미 있으면 더 새로운 generatedAt로 교체(재실행 idempotent).
 * - 최신순 정렬 후 상한(cap)까지만 유지 → 오래된 항목은 잘림.
 * 이력을 지어내지 않고, 넘어온 1건만 반영한다.
 */
export function mergeSnapshot(
  existing: StatusHistoryEntry[],
  entry: StatusHistoryEntry,
  cap = MAX_HISTORY_ENTRIES,
): StatusHistoryEntry[] {
  const kept = existing.filter((e) => {
    if (e.asOfBusinessDate !== entry.asOfBusinessDate) return true;
    // 같은 기준일: 기존이 더 새롭거나 같으면 유지(교체 안 함), 아니면 제거하고 새 항목으로 대체.
    return e.generatedAt > entry.generatedAt;
  });
  const alreadyNewer = kept.some(
    (e) => e.asOfBusinessDate === entry.asOfBusinessDate && e.generatedAt >= entry.generatedAt,
  );
  const merged = alreadyNewer ? kept : [...kept, entry];
  merged.sort(byGeneratedDesc);
  return merged.slice(0, cap);
}

/** buildStatusSnapshotRecord 입력 — 라이브 값(page.tsx·append 훅)에서 주입. */
export interface SnapshotInput {
  generatedAt?: string;
  asOfBusinessDate?: string;
  pricesSyncedAt?: string;
  metricsVersion?: string;
  universeCount?: number | null;
  suspectCount?: number | null;
  missingFinancialsCount?: number | null;
  priceLagCount?: number | null;
}

/**
 * 라이브 값 → 스냅샷 레코드 1건(순수). 필수(generatedAt·asOfBusinessDate) 없으면 null.
 * 진단 수치는 넘어온 값만 기록하고, 없으면 null(미기록)로 둔다.
 */
export function buildStatusSnapshotRecord(input: SnapshotInput): StatusHistoryEntry | null {
  return coerceEntry({
    generatedAt: input.generatedAt,
    asOfBusinessDate: input.asOfBusinessDate,
    pricesSyncedAt: input.pricesSyncedAt,
    metricsVersion: input.metricsVersion,
    universeCount: input.universeCount ?? null,
    suspectCount: input.suspectCount ?? null,
    missingFinancialsCount: input.missingFinancialsCount ?? null,
    priceLagCount: input.priceLagCount ?? null,
  });
}

/**
 * append-only 로그를 읽어 검증·정렬·상한 적용한 이력 배열을 반환(서버 전용, fs).
 * 파일이 없거나 형식 오류면 **빈 배열**(graceful — insider-signals.json 폴백과 동일 패턴).
 * absPath는 테스트용 오버라이드(기본 = STATUS_HISTORY_ABS_PATH).
 */
export function readStatusHistory(
  absPath: string = STATUS_HISTORY_ABS_PATH,
  cap = MAX_HISTORY_ENTRIES,
): StatusHistoryEntry[] {
  try {
    if (!fs.existsSync(absPath)) return [];
    return parseStatusHistory(fs.readFileSync(absPath, "utf-8"), cap);
  } catch {
    return [];
  }
}
