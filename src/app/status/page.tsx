import { dataMetadata, isDataStale } from "@/lib/realStocks";
import { dataStatus, dataStatusByLocale, metricsChangelogPath, VERIFICATION_SOURCES } from "@/lib/dataStatus";
import { getAlertedTickers } from "@/lib/marketAlert";
import { getPriceLagSummary } from "@/lib/priceLag";
import { readStatusHistory } from "@/lib/statusHistory";
import { StatusContent } from "@/components/status/StatusContent";
import { trustKeywords, uniqueKeywords } from "@/lib/seoKeywords";

export const metadata = {
  title: "주식 데이터 기준일·출처 — 오른스코어",
  description: "오른스코어의 주식 데이터 기준일, KRX·Naver Finance·DART 출처, 점수 산식 버전, 갱신 상태를 확인하는 데이터 상태 페이지.",
  keywords: uniqueKeywords(trustKeywords),
};

export const revalidate = 600;

// asOfBusinessDate(YYYYMMDD) 기준 경과일 계산
function daysSince(yyyymmdd: string | undefined): number | null {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return null;
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const then = new Date(y, m - 1, d).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

// generatedAt(ISO·GitHub Actions UTC 기준 naive)을 "원본 UTC"와 "KST(+9h)" 두 표기로 변환.
// 한국 사용자 혼동(장마감 전 오전처럼 보임) 방지를 위해 KST를 우선 노출한다.
function formatScoreTimes(iso: string | undefined): { kst: string; utc: string } {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) {
    const fallback = iso ? iso.slice(0, 16).replace("T", " ") : "—";
    return { kst: fallback, utc: fallback };
  }
  const utc = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
  const base = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  const k = new Date(base + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const kst = `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
  return { kst, utc };
}

export default async function StatusPage() {
  const priceAge = daysSince(dataMetadata.asOfBusinessDate);
  // 헤더·푸터와 동일한 기준(2영업일 이상 경과)으로 지연 판정 — 화면 간 신선도 표기 일치.
  const priceStale = isDataStale(dataMetadata.asOfBusinessDate);
  const alertedCount = (await getAlertedTickers()).size;
  const sc = dataStatus.selfCheck;
  // 종목별 가격 기준일 불일치(전역 기준일보다 과거인 종목) — 기존 가격 파일에서만 파생, 데이터셋 무변경.
  const priceLag = getPriceLagSummary();
  const { kst: scoreTimeKst, utc: scoreTimeUtc } = formatScoreTimes(dataMetadata.generatedAt);
  // 데이터 상태 이력(append-only 스냅샷 로그). 로그 파일이 아직 없으면 빈 배열 → 표시부는
  // 가짜 과거를 그리지 않고 "로깅 활성화 이후부터 쌓인다"는 안내만 노출한다(정직성).
  const statusHistory = readStatusHistory();

  // 다국어 v2: 데이터 파생값(dataStatusByLocale)·서버 계산값을 직렬화 props로 넘기고,
  // 페이지 크롬 번역은 클라이언트 표시부(StatusContent)가 statusCopy에서 읽는다.
  return (
    <StatusContent
      dataStatusByLocale={dataStatusByLocale}
      priceStale={priceStale}
      priceAge={priceAge}
      scoreTimeKst={scoreTimeKst}
      scoreTimeUtc={scoreTimeUtc}
      alertedCount={alertedCount}
      metricsChangelogPath={metricsChangelogPath}
      verificationSources={VERIFICATION_SOURCES}
      statusHistory={statusHistory}
      priceLag={{
        count: priceLag.count,
        symbols: priceLag.lagged.map((l) => ({
          ticker: l.ticker,
          name: l.name,
          priceDate: l.priceDate,
          businessDaysBehind: l.businessDaysBehind,
        })),
      }}
      selfCheck={{
        suspectCount: sc.suspectCount,
        missingFinancialsCount: sc.missingFinancialsCount,
        universeCount: sc.universeCount,
        metricsVersionMatch: sc.metricsVersionMatch,
        expectedMetricsVersion: sc.expectedMetricsVersion,
      }}
    />
  );
}
