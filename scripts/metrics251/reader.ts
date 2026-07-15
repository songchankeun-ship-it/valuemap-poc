// Metrics 2.5.1 shadow reader 계약 (Slice J) — 저장된 스냅샷/manifest/pointer/projection 을 "읽기"만 한다.
//
// 계약 정본(§3.1, §10 Slice J): Metrics 2.5.1 최종 점수는 Python 엔진(scripts/metrics251_engine.py)이
// 확정 계산·봉인한다. 이 TypeScript 모듈은 그 저장된 계약을 타입 안전하게 읽고 표현만 한다 —
// 점수를 재계산하지 않고, 산식을 구현하지도 import 하지도 않는다.
//
// - 공개 UI/API 에 연결하지 않는다(공개 정본은 Metrics 2.4 유지).
// - src/lib/metrics.ts(Metrics 2.4 공개 호환 계산)를 import 하지 않는다 — 버전 경계 분리(§3.1).
// - 결측은 50점·평균으로 대체하지 않는다 — null 을 그대로 전파한다(§3.2, 지시 "never fill with 50").
//
// 모든 함수는 순수·결정적이며 부작용이 없다. 입력은 이미 파싱된 JSON 객체다(파일 IO 는 호출자 책임).

import {
  REQUIRED_KEYS,
  CHECKSUM_METADATA,
  ELIGIBILITY_REASONS,
  NON_EXCLUDING_REASONS,
  READ_STATUSES,
  type EligibilityReason,
  type FactorKey,
  type ReadStatus,
  type Metrics251Projection,
} from "./contracts.generated";

// 이 reader 는 저장된 점수만 소비한다는 것을 코드로 표식(정적 가드가 확인).
export const READS_STORED_SCORES_ONLY = true as const;
// 버전 경계: 이 계약은 2.5.1 shadow 전용이며 Metrics 2.4 공개 계산과 분리된다.
export const METRICS_251_VERSION_BOUNDARY = "2.5.1-shadow" as const;

// ── 저장 아티팩트 타입(Python 정본 계약; 필수키는 contracts.generated 의 REQUIRED_KEYS 로 가드) ──

/** factor 모집단 메타데이터 — count + population hash(§8). */
export interface FactorPopulation {
  count: number;
  hash: string;
}

/** 저장된 개별 factor 결과. 점수·원시값은 결측 시 null(대체 금지). */
export interface StoredFactorResult {
  factor: string;
  reason: EligibilityReason;
  raw: number | null;
  score: number | null;
  components?: Record<string, unknown>;
}

/** 저장된 종목 결과. compositeScore 는 네 factor 유효 교집합이 아니면 null. */
export interface StoredStockResult {
  ticker: string;
  factors: Record<string, StoredFactorResult>;
  compositeScore: number | null;
  rankingEligible: boolean;
  eligibilityReasons: Record<string, EligibilityReason>;
}

/** 불변 shadow 스냅샷(§8 데이터 계약). 체크섬/모집단 메타데이터를 반드시 포함한다. */
export interface CandidateSnapshot {
  engineVersion: string;
  configHash: string;
  inputManifestHash: string;
  marketDate: string;
  sourceDates: { prices: string | null; volumes: string | null; fundamentals: string | null };
  runState: string;
  stocks: StoredStockResult[];
  factorPopulations: Record<FactorKey, FactorPopulation>;
  rankingPopulation: FactorPopulation;
  eligibilityReasonCounts: Record<string, number>;
}

/** manifest 산출물 항목 — 체크섬 + 바이트 수. */
export interface ManifestArtifact {
  sha256: string;
  bytes: number;
}

/** 봉인된 QA manifest(§M251-D07). */
export interface ShadowManifest {
  snapshotId: string;
  marketDate: string;
  metricsVersion: string;
  runState: string;
  artifacts: Record<string, ManifestArtifact>;
  manifestHash: string;
}

/** 작은 current pointer(원자적 교체 대상, §M251-D07 6항). */
export interface ShadowPointer {
  snapshotId: string;
  marketDate: string;
  metricsVersion: string;
  manifestHash: string;
  runDir: string;
}

/** §M251-D05 세 층 비교 capability. 단일 canCompare 를 쓰지 않는다. */
export interface ComparisonCapabilities {
  raw: boolean;
  factorScore: Record<ComparisonMetricKeyLocal, boolean>;
  compositeScore: boolean;
  rank: boolean;
}
type ComparisonMetricKeyLocal = FactorKey;

// ── 예외 타입(부분 데이터 금지 — 무결성 위반이면 던진다) ──────────────────────

export class ContractViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractViolation";
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function requireKeys(obj: Record<string, unknown>, keys: readonly string[], label: string): void {
  const missing = keys.filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
  if (missing.length > 0) {
    throw new ContractViolation(`${label}: 필수 키 누락 [${missing.join(", ")}]`);
  }
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ContractViolation(`${label}: 비어 있지 않은 문자열이어야 함`);
  }
  return value;
}

// ── 체크섬 메타데이터 존재 강제(§8) — 무결성 필드가 비면 계약 위반 ────────────

/**
 * 스냅샷의 체크섬/모집단 해시 메타데이터가 모두 존재하고 비어 있지 않은지 강제한다.
 * configHash·inputManifestHash + 각 factor 모집단 hash + ranking 모집단 hash.
 * 존재 강제일 뿐 재계산이 아니다.
 */
export function assertChecksumMetadata(snapshot: CandidateSnapshot): void {
  const snapshotFields = snapshot as unknown as Record<string, unknown>;
  for (const key of CHECKSUM_METADATA.snapshotHashKeys) {
    requireNonEmptyString(snapshotFields[key], `snapshot.${key}`);
  }
  const popHashKey = CHECKSUM_METADATA.populationHashKey;
  for (const [factor, pop] of Object.entries(snapshot.factorPopulations)) {
    const popFields = pop as unknown as Record<string, unknown>;
    requireNonEmptyString(popFields[popHashKey], `factorPopulations.${factor}.${popHashKey}`);
  }
  const rankingFields = snapshot.rankingPopulation as unknown as Record<string, unknown>;
  requireNonEmptyString(rankingFields[popHashKey], `rankingPopulation.${popHashKey}`);
}

// ── typed reader — 저장 객체를 검증하고 타입을 부여(부분 데이터 반환 금지) ─────

/** 파싱된 스냅샷 객체를 검증하고 CandidateSnapshot 으로 좁힌다. 무결성 위반이면 던진다. */
export function readSnapshot(raw: unknown): CandidateSnapshot {
  if (!isObject(raw)) throw new ContractViolation("snapshot: 객체가 아님");
  requireKeys(raw, REQUIRED_KEYS.snapshot, "snapshot");
  if (!Array.isArray(raw.stocks)) throw new ContractViolation("snapshot.stocks: 배열이어야 함");
  const snapshot = raw as unknown as CandidateSnapshot;
  assertChecksumMetadata(snapshot);
  return snapshot;
}

/** 파싱된 pointer 객체를 검증하고 좁힌다. */
export function readPointer(raw: unknown): ShadowPointer {
  if (!isObject(raw)) throw new ContractViolation("pointer: 객체가 아님");
  requireKeys(raw, REQUIRED_KEYS.pointer, "pointer");
  requireNonEmptyString(raw.manifestHash, "pointer.manifestHash");
  return raw as unknown as ShadowPointer;
}

/** 파싱된 manifest 객체를 검증하고 좁힌다. */
export function readManifest(raw: unknown): ShadowManifest {
  if (!isObject(raw)) throw new ContractViolation("manifest: 객체가 아님");
  requireKeys(raw, REQUIRED_KEYS.manifest, "manifest");
  requireNonEmptyString(raw.manifestHash, "manifest.manifestHash");
  if (!isObject(raw.artifacts)) throw new ContractViolation("manifest.artifacts: 객체여야 함");
  return raw as unknown as ShadowManifest;
}

/** pointer 와 manifest 의 manifestHash 가 일치하는지(무결성 재검증, §M251-D07 7항). */
export function pointerMatchesManifest(pointer: ShadowPointer, manifest: ShadowManifest): boolean {
  return pointer.manifestHash === manifest.manifestHash;
}

// ── null 처리 헬퍼 — 결측을 숫자로 대체하지 않고 정직하게 전파 ────────────────

/** 종합점수가 저장돼 있으면 그 값, 아니면 null(대체값 없음). */
export function compositeScoreOrNull(stock: StoredStockResult): number | null {
  return stock.compositeScore ?? null;
}

/** 특정 factor 의 저장 점수. 결측이면 null(50 등으로 채우지 않음). */
export function factorScoreOrNull(stock: StoredStockResult, factor: FactorKey): number | null {
  const result = stock.factors[factor];
  if (result === undefined) return null;
  return result.score ?? null;
}

/** 종목이 순위 대상인지(네 factor 유효 교집합). */
export function isRankingEligible(stock: StoredStockResult): boolean {
  return stock.rankingEligible === true;
}

// ── enum 완전성(exhaustiveness) — assertNever 로 컴파일 타임에 누락을 잡는다 ──

function assertNever(x: never): never {
  throw new ContractViolation(`처리되지 않은 enum 값: ${String(x)}`);
}

const EXCLUDING_SET: ReadonlySet<string> = new Set(
  ELIGIBILITY_REASONS.filter((r) => !(NON_EXCLUDING_REASONS as readonly string[]).includes(r))
);

/** 자격 사유가 제외 사유인지(VALID/QUALITY_WARNING 만 비제외). 알 수 없는 값은 던진다. */
export function isExcludingReason(reason: EligibilityReason): boolean {
  return EXCLUDING_SET.has(reason);
}

/**
 * 자격 사유 → 안정적 분류 라벨 키. 모든 enum 멤버를 다뤄야 하며, 새 사유가 추가되면
 * assertNever 가 컴파일을 실패시킨다(enum 완전성 증거).
 */
export function eligibilityReasonLabelKey(reason: EligibilityReason): string {
  switch (reason) {
    case "VALID":
      return "eligibility.valid";
    case "QUALITY_WARNING":
      return "eligibility.qualityWarning";
    case "MISSING_INPUT":
      return "eligibility.missingInput";
    case "INSUFFICIENT_HISTORY":
      return "eligibility.insufficientHistory";
    case "NON_POSITIVE_FUNDAMENTAL":
      return "eligibility.nonPositiveFundamental";
    case "SOURCE_DATE_STALE":
      return "eligibility.sourceDateStale";
    case "SOURCE_DATE_MISMATCH":
      return "eligibility.sourceDateMismatch";
    case "ZERO_VARIANCE":
      return "eligibility.zeroVariance";
    default:
      return assertNever(reason);
  }
}

/** read 상태 → 운영 심각도 순위(낮을수록 정상). enum 완전성 가드 포함. */
export function readStatusSeverity(status: ReadStatus): number {
  switch (status) {
    case "OK":
      return 0;
    case "DEGRADED":
      return 1;
    case "UNAVAILABLE":
      return 2;
    default:
      return assertNever(status);
  }
}

// ── 비교 capability 접근자(§M251-D05) — 저장된 capability 를 그대로 읽는다 ────

/** 세 층 capability 를 검증·좁힘. */
export function readComparisonCapabilities(raw: unknown): ComparisonCapabilities {
  if (!isObject(raw)) throw new ContractViolation("capabilities: 객체가 아님");
  requireKeys(raw, ["raw", "factorScore", "compositeScore", "rank"], "capabilities");
  if (!isObject(raw.factorScore)) throw new ContractViolation("capabilities.factorScore: 객체여야 함");
  return raw as unknown as ComparisonCapabilities;
}

/** 어떤 층이라도 비교 가능한지(전부 숨기지 않기 위한 판정, §M251-D05). */
export function anyComparisonLayerAvailable(caps: ComparisonCapabilities): boolean {
  return (
    caps.raw ||
    caps.compositeScore ||
    caps.rank ||
    Object.values(caps.factorScore).some((v) => v === true)
  );
}

// ── projection reader — 저장 projection DTO 를 그대로 읽는다(재계산 없음) ─────

/** projection DTO 의 버전/체크섬 메타데이터 존재를 강제하고 타입을 좁힌다. */
export function readProjection(raw: unknown): Metrics251Projection {
  if (!isObject(raw)) throw new ContractViolation("projection: 객체가 아님");
  requireNonEmptyString(raw.configHash, "projection.configHash");
  requireNonEmptyString(raw.projectionVersion, "projection.projectionVersion");
  if (!Array.isArray(raw.stocks)) throw new ContractViolation("projection.stocks: 배열이어야 함");
  return raw as unknown as Metrics251Projection;
}

export const VALID_READ_STATUSES: readonly ReadStatus[] = READ_STATUSES;
